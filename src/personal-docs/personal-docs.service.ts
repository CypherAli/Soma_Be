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
  static readonly MAX_BYTES = 50 * 1024 * 1024;
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

  /** PDF và Word hiện đại (.docx) — .doc đời cũ không đọc được trực tiếp. */
  static readonly PDF_MIME = 'application/pdf';
  static readonly DOCX_MIME =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  async upload(file: Express.Multer.File | undefined, token?: string) {
    const userId = await this.userIdOf(token);
    if (!file) throw new BadRequestException('Chưa chọn tệp');
    // Một số trình duyệt/tình huống tải lên báo mimetype chung chung
    // (octet-stream, rỗng) — chốt thêm bằng đuôi tên file cho chắc.
    const name = (file.originalname ?? '').toLowerCase();
    const isPdf =
      file.mimetype === PersonalDocsService.PDF_MIME || name.endsWith('.pdf');
    const isDocx =
      file.mimetype === PersonalDocsService.DOCX_MIME || name.endsWith('.docx');
    if (!isPdf && !isDocx) {
      throw new BadRequestException(
        file.mimetype === 'application/msword' || name.endsWith('.doc')
          ? 'File .doc đời cũ không đọc được — hãy mở bằng Word và Lưu thành .docx rồi tải lên.'
          : 'Chỉ nhận tệp PDF hoặc Word (.docx)',
      );
    }
    if (file.size > PersonalDocsService.MAX_BYTES) {
      throw new BadRequestException('Tệp lớn hơn 50 MB');
    }

    const doc = await this.prisma.personalDoc.create({
      data: {
        userId,
        filename: decodeFilename(file.originalname).slice(0, 240),
        bytes: file.size,
        status: 'processing',
      },
    });

    try {
      // Loại file chốt theo đuôi tên khi mimetype chung chung (xem ở trên).
      const kind =
        file.mimetype === PersonalDocsService.DOCX_MIME ||
        (file.originalname ?? '').toLowerCase().endsWith('.docx')
          ? PersonalDocsService.DOCX_MIME
          : PersonalDocsService.PDF_MIME;
      const { pages: rawPages } = await readDocument(file.buffer, kind);
      // PDF tiếng Việt hay bị đọc ra chữ vỡ font (ToUnicode hỏng) hoặc
      // UTF-8 bị giải mã thành latin1 ("Triệu" → "Triã…u"). Sửa ngay sau khi
      // đọc để bộ bóc regex A–E và AI đọc hộ đều thấy chữ đúng.
      const pages = rawPages.map(fixPdfText);
      const garbled = garbledRatio(pages);
      const report = garbled
        ? { questions: [], missingAnswer: 0, malformed: 0 }
        : parseMcq(pages);
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
      const note = garbled
        ? 'Không đọc được chữ trong PDF này (font nhúng hỏng — chữ tiếng Việt vỡ nát khi bóc). ' +
          'Hãy thử bản PDF text khác, hoặc chụp/scan rõ rồi dùng công cụ OCR tiếng Việt trước khi tải lên.'
        : keep.length
          ? `Bóc được ${keep.length} câu. Bỏ ${report.missingAnswer} câu không dò được đáp án, ` +
            `${report.malformed} câu vỡ cấu trúc. Hãy duyệt trước khi dùng.`
          : report.missingAnswer
            ? `Thấy ${report.missingAnswer} câu đánh số nhưng không có vùng đáp án ("12-C") nên không dùng được câu nào.`
            : report.malformed
              ? `Thấy ${report.malformed} đoạn đánh số nhưng không phải câu trắc nghiệm (thiếu phương án A–E).`
              : 'Không nhận ra bộ câu hỏi trắc nghiệm nào trong tài liệu này. ' +
                'Bộ bóc cần câu đánh số ("12." hoặc "Câu 12.") kèm phương án A–E và đáp án ' +
                '(vùng đáp án "12-C" hoặc chốt ngay sau câu "Đáp án: C"). ' +
                'Nếu đây là giáo trình/bài giảng (không phải bộ đề), hãy dùng nút "Nhờ AI đọc lại" — ' +
                'AI cũng chỉ đọc được khi văn bản bóc ra còn đọc được.';

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
        // Chữ vỡ font thì không trả: AI đọc rác cũng ra rác, chỉ tốn hạn mức.
        text: keep.length || garbled ? null : joinPages(pages),
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
    // Tự chữa tên file vỡ chữ của các bản upload cũ (trước khi có
    // decodeFilename đúng): chữa xong ghi luôn xuống DB, lần sau khỏi chữa.
    const healed = await Promise.all(
      docs.map(async (d) => {
        const filename = decodeFilename(d.filename);
        if (filename !== d.filename) {
          await this.prisma.personalDoc.update({
            where: { id: d.id },
            data: { filename },
          });
        }
        return {
          ...d,
          filename,
          questionCount: d._count.questions,
          approvedCount: approvedByDoc.get(d.id) ?? 0,
        };
      }),
    );
    return { docs: healed };
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
    return {
      doc: { ...doc, filename: decodeFilename(doc.filename) },
      questions,
    };
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
        region: decodeFilename(q.doc.filename),
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.personalQuestion.update({
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
      if (!updated.approved) {
        await tx.reviewItem.deleteMany({
          where: { userId, source: 'personal', itemKey: `personal:${id}` },
        });
      }
      return updated;
    });
  }

  async approveAll(docId: string, token?: string) {
    const userId = await this.userIdOf(token);
    const doc = await this.prisma.personalDoc.findFirst({
      where: { id: docId, userId },
      select: { id: true },
    });
    if (!doc) throw new NotFoundException('Không có tài liệu này');
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
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.personalQuestion.deleteMany({
        where: { id, userId },
      });
      if (!count) throw new NotFoundException('Không có câu này');
      await tx.reviewItem.deleteMany({
        where: { userId, source: 'personal', itemKey: `personal:${id}` },
      });
      return { success: true };
    });
  }

  async deleteDoc(id: string, token?: string) {
    const userId = await this.userIdOf(token);
    return this.prisma.$transaction(async (tx) => {
      const questions = await tx.personalQuestion.findMany({
        where: { docId: id, userId },
        select: { id: true },
      });
      const { count } = await tx.personalDoc.deleteMany({
        where: { id, userId },
      });
      if (!count) throw new NotFoundException('Không có tài liệu này');
      if (questions.length) {
        await tx.reviewItem.deleteMany({
          where: {
            userId,
            source: 'personal',
            itemKey: {
              in: questions.map((question) => `personal:${question.id}`),
            },
          },
        });
      }
      return { success: true };
    });
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

/**
 * Multer giải mã tên tệp multipart theo latin1, nên tên tiếng Việt vỡ chữ
 * ("Review đề Giải Phẫu…" → "Review Ä…").
 *
 * Dấu hiệu nhận diện KHÔNG phải tỷ lệ chữ Việt: chuỗi vỡ vẫn đầy ký tự trông
 * giống tiếng Việt (á, â) nên so tỷ lệ là thua — "Review Ä|»â…" chấm cao hơn
 * cả bản đúng. Dấu hiệu đúng là ký tự điều khiển U+0080–U+009F: văn bản đọc
 * đúng không bao giờ chứa chúng, nhưng byte UTF-8 của đ (C4 91), ề (E1 BB 81)
 * khi đọc thành latin1 thì rớt đúng vào vùng này. Có mặt chúng là chắc chắn vỡ.
 */
/** Export để test trực tiếp — logic giải mã tên file vỡ chữ latin1. */
export function decodeFilename(name: string): string {
  if (!name || !/[\u0080-\u009F]/.test(name)) return name;
  try {
    const once = Buffer.from(name, 'latin1').toString('utf8');
    // Mã hoá kép: giải một lần vẫn còn ký tự điều khiển thì giải tiếp lần nữa.
    if (/[\u0080-\u009F�]/.test(once)) {
      const twice = Buffer.from(once, 'latin1').toString('utf8');
      if (!/[\u0080-\u009F�]/.test(twice)) return twice;
    }
    // Bản giải mã mà vẫn còn rác điều khiển/thay thế thì giữ tên gốc còn hơn.
    if (/[\u0080-\u009F�]/.test(once)) return name;
    return once;
  } catch {
    return name;
  }
}

/**
 * Sửa chữ tài liệu vỡ kiểu mã hoá (UTF-8 bị đọc thành latin1) từng trang.
 *
 * Cùng nguyên tắc với `decodeFilename`: ký tự điều khiển U+0080–U+009F là bằng
 * chứng vỡ chắc chắn, không so tỷ lệ chữ Việt (chuỗi vỡ vẫn đầy á/â nên so là
 * thua). Không có chúng thì giữ nguyên — chữ vỡ font ToUnicode là bệnh khác,
 * giải mã ngược chỉ làm nát thêm.
 */
/** Export để test trực tiếp. */
export function fixPdfText(page: string): string {
  if (!page || !/[\u0080-\u009F]/.test(page)) return page;
  try {
    const fixed = Buffer.from(page, 'latin1').toString('utf8');
    if (/[\u0080-\u009F�]/.test(fixed)) return page;
    return fixed;
  } catch {
    return page;
  }
}

/**
 * Chữ vỡ font ToUnicode: ký tự rời rạc, gần như không có nguyên âm —
 * regex bóc đề và cả AI đều không đọc nổi. Đếm trên mẫu đầu tài liệu.
 */
function garbledRatio(pages: string[]): boolean {
  const sample = pages.slice(0, 5).join('\n').replace(/\s/g, '');
  if (sample.length < 200) return false;
  const vowels = sample.match(
    /[aeiouyàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđAEIOUYÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g,
  );
  return (vowels?.length ?? 0) / sample.length < 0.15;
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
 * Đọc văn bản từng trang từ PDF hoặc Word (.docx).
 *
 * Cả hai thư viện đều nạp động để tiến trình khởi động không phải kéo theo bộ
 * máy đọc file khi chưa ai tải tài liệu nào lên. Word không có khái niệm trang
 * nên cắt văn bản thành từng đoạn ~4000 ký tự làm "trang giả" — đủ để bộ bóc
 * gắn số trang đối chiếu và AI trả lại `page` cho từng câu.
 */
async function readDocument(
  data: Buffer,
  mimetype: string,
): Promise<{ pages: string[] }> {
  if (mimetype === PersonalDocsService.DOCX_MIME) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: data });
    const text = result.value ?? '';
    if (!text.trim()) throw new Error('Không đọc được chữ trong file Word này');
    return { pages: splitPseudoPages(text) };
  }
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

/** Cắt văn bản Word thành trang giả theo đoạn văn, mỗi trang ~4000 ký tự. */
function splitPseudoPages(text: string): string[] {
  const PAGE_CHARS = 4000;
  const paragraphs = text.split(/\n{2,}|\r?\n/);
  const pages: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if ((current + para).length > PAGE_CHARS && current.trim()) {
      pages.push(current.trim());
      current = '';
    }
    current += (current ? '\n' : '') + para;
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length ? pages : [text];
}
