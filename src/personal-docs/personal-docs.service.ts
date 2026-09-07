import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { parseMcq } from './mcq-parser';

export type EditQuestionInput = {
  stem?: string;
  options?: Record<string, string>;
  answer?: string;
  explanation?: string | null;
  approved?: boolean;
};

/**
 * Bộ đề riêng dựng từ tài liệu người dùng tải lên.
 *
 * BA CAM KẾT trang web hứa với người dùng, thực thi ở đây chứ không chỉ là chữ
 * trên giao diện:
 *  - "không ghi vào ngân hàng đề chung": câu bóc ra vào bảng `PersonalQuestion`
 *    gắn `userId`, không đụng tới `QuizQuestion` dùng chung;
 *  - "chỉ tài khoản của bạn truy cập": mọi truy vấn đều lọc theo `userId` lấy
 *    từ token, không bao giờ theo id gửi lên;
 *  - "có thể sửa hoặc loại câu sai": câu mặc định CHỜ DUYỆT, phải sửa/duyệt mới
 *    được đem ra hỏi.
 *
 * Tệp PDF gốc KHÔNG được lưu lại. Bóc xong là bỏ khỏi bộ nhớ — máy chủ không
 * giữ bản sao tài liệu của người dùng thì mới thật sự giữ được lời hứa riêng tư.
 */
@Injectable()
export class PersonalDocsService {
  static readonly MAX_BYTES = 25 * 1024 * 1024;
  /** Trần số câu một tài liệu, chặn PDF khổng lồ làm nghẽn cơ sở dữ liệu. */
  private static readonly MAX_QUESTIONS = 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private async userIdOf(token?: string) {
    const me = await this.auth.me(token).catch(() => null);
    if (!me) throw new UnauthorizedException('Cần đăng nhập');
    return me.user.id;
  }

  async upload(file: Express.Multer.File | undefined, token?: string) {
    const userId = await this.userIdOf(token);
    if (!file) throw new BadRequestException('Chưa chọn tệp');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Chỉ nhận tệp PDF');
    }
    if (file.size > PersonalDocsService.MAX_BYTES) {
      throw new BadRequestException('Tệp lớn hơn 25 MB');
    }

    const doc = await this.prisma.personalDoc.create({
      data: {
        userId,
        filename: file.originalname.slice(0, 240),
        bytes: file.size,
        status: 'processing',
      },
    });

    try {
      const { pages } = await readPdf(file.buffer);
      const report = parseMcq(pages);
      const keep = report.questions.slice(0, PersonalDocsService.MAX_QUESTIONS);

      if (keep.length) {
        await this.prisma.personalQuestion.createMany({
          data: keep.map((q) => ({
            docId: doc.id,
            userId,
            stem: q.stem,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
            page: q.page,
          })),
        });
      }

      // Nói RÕ vì sao hỏng, đừng chỉ báo con số: "bỏ 25 câu" khiến người dùng
      // tưởng tài liệu đúng chuẩn mà bộ bóc kém, trong khi hai nguyên nhân
      // dưới đây đòi hai cách xử lý hoàn toàn khác nhau.
      const note = keep.length
        ? `Bóc được ${keep.length} câu. Bỏ ${report.missingAnswer} câu không dò được đáp án, ` +
          `${report.malformed} câu vỡ cấu trúc. Hãy duyệt trước khi dùng.`
        : report.missingAnswer
          ? `Thấy ${report.missingAnswer} câu đánh số nhưng không có vùng đáp án ("12-C") nên không dùng được câu nào.`
          : report.malformed
            ? `Thấy ${report.malformed} đoạn đánh số nhưng không phải câu trắc nghiệm (thiếu phương án A–E).`
            : 'Không nhận ra bộ câu hỏi trắc nghiệm nào trong tài liệu này. ' +
              'Bộ bóc cần câu đánh số ("12.") kèm phương án A–E và một vùng đáp án ("12-C").';

      return {
        doc: await this.prisma.personalDoc.update({
          where: { id: doc.id },
          data: {
            status: keep.length ? 'ready' : 'failed',
            pages: pages.length,
            note,
          },
        }),
        parsed: keep.length,
        missingAnswer: report.missingAnswer,
        malformed: report.malformed,
        // Bộ luật bó tay thì trả VĂN BẢN về cho phía web, để người dùng có thể
        // tự quyết định có nhờ AI đọc hộ hay không. Trả sẵn ở đây vì máy chủ
        // KHÔNG giữ tệp gốc — hỏi lại lần nữa là phải tải lên lại từ đầu.
        text: keep.length ? null : joinPages(pages),
      };
    } catch (error) {
      const note = `Không đọc được tệp: ${(error as Error).message}`.slice(
        0,
        500,
      );
      await this.prisma.personalDoc.update({
        where: { id: doc.id },
        data: { status: 'failed', note },
      });
      throw new BadRequestException(note);
    }
  }

  /**
   * Nhận các câu do AI đọc ra khi bộ luật bó tay.
   *
   * Máy chủ KHÔNG tự gọi AI: khoá mô hình nằm ở tầng web, và quan trọng hơn,
   * gửi tài liệu của người dùng ra dịch vụ ngoài phải do chính họ bấm nút. Ở
   * đây chỉ nhận kết quả, lọc lại cho chặt, và cất vào đúng chỗ.
   *
   * Câu do AI đọc cũng vào trạng thái CHỜ DUYỆT như câu bộ luật bóc — thậm chí
   * còn đáng ngờ hơn, nên `origin` ghi rõ "ai" để màn duyệt nói thật với người
   * đọc rằng câu này do mô hình dựng lại.
   */
  async addAiQuestions(
    docId: string,
    input: { questions: unknown[] },
    token?: string,
  ) {
    const userId = await this.userIdOf(token);
    const doc = await this.prisma.personalDoc.findFirst({
      where: { id: docId, userId },
    });
    if (!doc) throw new NotFoundException('Không có tài liệu này');

    const clean = (Array.isArray(input.questions) ? input.questions : [])
      .map((raw) => sanitiseQuestion(raw))
      .filter((q): q is CleanQuestion => q !== null)
      .slice(0, PersonalDocsService.MAX_QUESTIONS);

    if (clean.length) {
      await this.prisma.personalQuestion.createMany({
        data: clean.map((q) => ({
          docId: doc.id,
          userId,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          page: q.page,
          origin: 'ai',
        })),
      });
    }

    const note = clean.length
      ? `AI đọc được ${clean.length} câu từ tài liệu này. Câu do AI dựng lại nên hãy duyệt kỹ trước khi học.`
      : 'AI cũng không tìm thấy câu trắc nghiệm nào trong tài liệu này — nhiều khả năng đây không phải bộ đề.';

    return {
      doc: await this.prisma.personalDoc.update({
        where: { id: doc.id },
        data: { status: clean.length ? 'ready' : 'failed', note },
      }),
      parsed: clean.length,
    };
  }

  async listDocs(token?: string) {
    const userId = await this.userIdOf(token);
    const docs = await this.prisma.personalDoc.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });
    const approved = await this.prisma.personalQuestion.groupBy({
      by: ['docId'],
      where: { userId, approved: true },
      _count: { _all: true },
    });
    const approvedByDoc = new Map(
      approved.map((a) => [a.docId, a._count._all]),
    );
    return {
      docs: docs.map((d) => ({
        ...d,
        questionCount: d._count.questions,
        approvedCount: approvedByDoc.get(d.id) ?? 0,
      })),
    };
  }

  async questions(docId: string, token?: string) {
    const userId = await this.userIdOf(token);
    // Lọc theo CẢ docId lẫn userId: chỉ lọc docId là ai đoán được id thì đọc
    // được tài liệu của người khác.
    const doc = await this.prisma.personalDoc.findFirst({
      where: { id: docId, userId },
    });
    if (!doc) throw new NotFoundException('Không có tài liệu này');
    const questions = await this.prisma.personalQuestion.findMany({
      where: { docId, userId },
      orderBy: { page: 'asc' },
    });
    return { doc, questions };
  }

  /** Ngân hàng đề cá nhân: chỉ câu ĐÃ DUYỆT mới ra đề. */
  async bank(token?: string) {
    const userId = await this.userIdOf(token);
    const questions = await this.prisma.personalQuestion.findMany({
      where: { userId, approved: true },
      include: { doc: { select: { filename: true } } },
    });
    return {
      questions: questions.map((q) => ({
        id: q.id,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        page: q.page,
        region: q.doc.filename,
      })),
    };
  }

  async editQuestion(id: string, input: EditQuestionInput, token?: string) {
    const userId = await this.userIdOf(token);
    const current = await this.prisma.personalQuestion.findFirst({
      where: { id, userId },
    });
    if (!current) throw new NotFoundException('Không có câu này');

    const options =
      input.options ?? (current.options as Record<string, string>);
    const answer = input.answer ?? current.answer;
    // Duyệt một câu mà khoá đáp án trỏ vào phương án không tồn tại là đưa vào
    // đề một câu không có đáp án đúng — chặn ngay tại đây, không đợi lúc ra đề.
    if (input.approved !== false && !options[answer]) {
      throw new BadRequestException(
        'Đáp án không nằm trong danh sách phương án',
      );
    }

    return this.prisma.personalQuestion.update({
      where: { id },
      data: {
        stem: input.stem?.slice(0, 4000) ?? current.stem,
        options,
        answer,
        explanation:
          input.explanation === undefined
            ? current.explanation
            : input.explanation
              ? input.explanation.slice(0, 4000)
              : null,
        approved: input.approved ?? current.approved,
      },
    });
  }

  async approveAll(docId: string, token?: string) {
    const userId = await this.userIdOf(token);
    const rows = await this.prisma.personalQuestion.findMany({
      where: { docId, userId },
    });
    // Chỉ duyệt hàng loạt những câu HỢP LỆ; câu có khoá đáp án hỏng phải sửa tay.
    const ok = rows.filter(
      (r) => (r.options as Record<string, string>)?.[r.answer],
    );
    await this.prisma.personalQuestion.updateMany({
      where: { id: { in: ok.map((r) => r.id) } },
      data: { approved: true },
    });
    return { approved: ok.length, skipped: rows.length - ok.length };
  }

  async deleteQuestion(id: string, token?: string) {
    const userId = await this.userIdOf(token);
    const { count } = await this.prisma.personalQuestion.deleteMany({
      where: { id, userId },
    });
    if (!count) throw new NotFoundException('Không có câu này');
    return { success: true };
  }

  async deleteDoc(id: string, token?: string) {
    const userId = await this.userIdOf(token);
    const { count } = await this.prisma.personalDoc.deleteMany({
      where: { id, userId },
    });
    if (!count) throw new NotFoundException('Không có tài liệu này');
    return { success: true };
  }
}

type CleanQuestion = {
  stem: string;
  options: Record<string, string>;
  answer: string;
  explanation: string | null;
  page: number | null;
};

/**
 * Chuỗi từ một giá trị KHÔNG BIẾT KIỂU do mô hình trả về.
 *
 * `String(x)` là cái bẫy ở đây: mô hình thỉnh thoảng trả `stem` là một object
 * (kiểu `{ text: "..." }`), và `String()` biến nó thành `"[object Object]"` —
 * đúng 15 ký tự, dài hơn ngưỡng tối thiểu, nên câu rác đó lọt thẳng vào hàng
 * chờ duyệt trông như một câu thật. Chỉ nhận chuỗi và số; mọi thứ khác coi như
 * không có.
 */
function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

/**
 * Lọc một câu do AI trả về.
 *
 * Bỏ thẳng câu có khoá đáp án không trỏ vào phương án nào: giữ lại là đưa vào
 * màn duyệt một câu KHÔNG THỂ duyệt, người dùng bấm mãi không hiểu vì sao.
 */
function sanitiseQuestion(raw: unknown): CleanQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Record<string, unknown>;
  const stem = textOf(q.stem).trim().slice(0, 4000);
  if (stem.length < 8) return null;

  const options: Record<string, string> = {};
  const src = (q.options ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(src)) {
    const label = key.trim().toUpperCase().slice(0, 2);
    const text = textOf(value).trim().slice(0, 1000);
    if (/^[A-F]$/.test(label) && text) options[label] = text;
  }
  if (Object.keys(options).length < 3) return null;

  const answer = textOf(q.answer).trim().toUpperCase().slice(0, 2);
  if (!options[answer]) return null;

  const page = Number(q.page);
  const explanation = textOf(q.explanation).slice(0, 4000) || null;
  return {
    stem,
    options,
    answer,
    explanation,
    page: Number.isFinite(page) && page > 0 ? Math.round(page) : null,
  };
}

/** Ghép trang có đánh dấu số trang, để AI trả lại được `page` cho từng câu. */
function joinPages(pages: string[]): string {
  const MAX_CHARS = 120_000;
  let out = '';
  for (let i = 0; i < pages.length; i += 1) {
    const chunk = `
[trang ${i + 1}]
${pages[i]}`;
    if (out.length + chunk.length > MAX_CHARS) break;
    out += chunk;
  }
  return out;
}

/**
 * Đọc văn bản từng trang.
 *
 * `pdf-parse` nạp động để tiến trình khởi động không phải kéo theo cả bộ máy
 * PDF khi chưa ai tải tài liệu nào lên.
 */
async function readPdf(data: Buffer): Promise<{ pages: string[] }> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    const pages = (result.pages ?? []).map((p) => p.text ?? '');
    return { pages: pages.length ? pages : [result.text ?? ''] };
  } finally {
    await parser.destroy();
  }
}
