import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import type { AuthUser } from '../auth/roles';
import { LOCALES } from './dto/admin.dto';

const PAGE = 25;

/** Trần cho thao tác hàng loạt: xem chú thích ở [QueuesService.bulkReview]. */
const BULK_MAX = 50;

/**
 * Ba HÀNG ĐỢI công việc: duyệt chuyên môn, đối chiếu trích dẫn, dịch nội dung.
 *
 * Vì sao tách khỏi khu Bệnh lý dù cùng dữ liệu: ba việc này là ba PHIÊN LÀM
 * VIỆC khác nhau. Người duyệt chuyên môn mở hai chục bài liền để đọc; người đối
 * chiếu trích dẫn mở sách ra và tick từng dòng; người dịch cần thấy bản gốc
 * tiếng Việt cạnh bản đích. Nhồi cả ba vào một bảng "bệnh lý" thì mỗi việc đều
 * phải lọc lại từ đầu và không việc nào làm nhanh được.
 */
@Injectable()
export class QueuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------- hàng chờ duyệt

  async reviewQueue(params: {
    clinicalSystem?: string;
    q?: string;
    page?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();
    const and: Prisma.PathologyWhereInput[] = [{ needsReview: true }];
    if (q) {
      and.push({
        OR: [
          { nameVi: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (params.clinicalSystem) {
      and.push({ clinicalSystem: params.clinicalSystem });
    }
    const where: Prisma.PathologyWhereInput = { AND: and };

    const [items, total] = await Promise.all([
      this.prisma.pathology.findMany({
        where,
        orderBy: [{ clinicalSystem: 'asc' }, { nameVi: 'asc' }],
        skip: (page - 1) * PAGE,
        take: PAGE,
        select: {
          id: true,
          slug: true,
          nameVi: true,
          clinicalSystem: true,
          severity: true,
          icdCode: true,
          source: true,
          sourcePage: true,
          content: { select: { locale: true, machineTranslated: true } },
          _count: { select: { citations: true } },
        },
      }),
      this.prisma.pathology.count({ where }),
    ]);

    return {
      items: items.map(({ content, _count, ...p }) => ({
        ...p,
        citations: _count.citations,
        locales: content.map((c) => c.locale),
        machineLocales: content
          .filter((c) => c.machineTranslated)
          .map((c) => c.locale),
        /*
         * Bài nào ĐỦ ĐIỀU KIỆN duyệt: có nội dung tiếng Việt (bản gốc) và có ít
         * nhất một trích dẫn. Thiếu một trong hai thì duyệt là ký vào một bài
         * chưa có gì để đọc hoặc không truy ngược được về tài liệu nào — giao
         * diện dựa vào cờ này để chặn duyệt hàng loạt.
         */
        ready: content.some((c) => c.locale === 'vi') && _count.citations > 0,
      })),
      total,
      page,
      pageSize: PAGE,
    };
  }

  /**
   * Duyệt hàng loạt.
   *
   * Trần 50 bản ghi một lượt, và CHỈ nhận bài đã đủ điều kiện. Không phải để
   * giữ máy chủ nhẹ — mà vì "duyệt chuyên môn" là một lời xác nhận về nội dung y
   * khoa; cho tick 106 bài một cái là biến nó thành thao tác vô nghĩa.
   *
   * Tham số là `approved`, KHÔNG phải `needsReview`. Cột trong cơ sở dữ liệu là
   * `needsReview` nên hai thứ ngược nhau — nhưng hợp đồng API thì phải đọc cùng
   * một chiều với endpoint trích dẫn kề bên: ở cả hai, `value: true` nghĩa là
   * "việc này đã xong". Để nguyên chiều của cột thì một hôm ai đó gửi
   * `value: true` với ý duyệt và duyệt ngược 50 bài mà không có lỗi nào báo ra.
   */
  async bulkReview(actor: AuthUser, ids: string[], approved: boolean) {
    const needsReview = !approved;
    const unique = [...new Set(ids)];
    if (unique.length === 0) throw new BadRequestException('Chưa chọn bài nào');
    if (unique.length > BULK_MAX) {
      throw new BadRequestException(
        `Mỗi lượt tối đa ${BULK_MAX} bài — duyệt chuyên môn là xác nhận về nội dung y khoa, không phải thao tác dọn hàng đợi.`,
      );
    }

    const rows = await this.prisma.pathology.findMany({
      where: { id: { in: unique } },
      select: {
        id: true,
        slug: true,
        needsReview: true,
        content: { select: { locale: true } },
        _count: { select: { citations: true } },
      },
    });
    if (rows.length !== unique.length) {
      throw new BadRequestException(
        'Có id không tồn tại trong danh sách gửi lên',
      );
    }

    // Chỉ chặn khi ĐANG duyệt. Trả về hàng chờ thì không cần điều kiện gì —
    // rút lại một lời xác nhận phải luôn làm được.
    if (approved) {
      const notReady = rows.filter(
        (r) =>
          !r.content.some((c) => c.locale === 'vi') || r._count.citations === 0,
      );
      if (notReady.length) {
        throw new BadRequestException(
          `${notReady.length} bài chưa đủ điều kiện duyệt (thiếu nội dung tiếng Việt hoặc thiếu trích dẫn): ${notReady
            .slice(0, 5)
            .map((r) => r.slug)
            .join(', ')}`,
        );
      }
    }

    const changed = rows.filter((r) => r.needsReview !== needsReview);
    await this.prisma.pathology.updateMany({
      where: { id: { in: changed.map((r) => r.id) } },
      data: { needsReview },
    });

    // Một dòng nhật ký cho CẢ lượt, kèm danh sách slug: ghi 50 dòng rời thì
    // nhật ký thành không đọc được, mà mất luôn thông tin "đây là một lượt".
    await this.audit.record({
      actor,
      action: 'verify',
      entity: 'pathology',
      entityId: `bulk:${changed.length}`,
      entityLabel: `${changed.length} bài · ${needsReview ? 'trả về chờ duyệt' : 'đánh dấu đã duyệt'}`,
      before: { needsReview: !needsReview },
      after: { needsReview, slugs: changed.map((r) => r.slug) },
    });

    return { updated: changed.length, skipped: rows.length - changed.length };
  }

  // ----------------------------------------------------------- trích dẫn

  async citations(params: {
    verified?: boolean;
    sourceId?: string;
    q?: string;
    page?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();
    const and: Prisma.PathologyCitationWhereInput[] = [];
    if (params.verified !== undefined) and.push({ verified: params.verified });
    if (params.sourceId) and.push({ sourceId: params.sourceId });
    if (q) {
      and.push({
        OR: [
          { pathology: { nameVi: { contains: q, mode: 'insensitive' } } },
          { pathology: { slug: { contains: q, mode: 'insensitive' } } },
          { quote: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    const where: Prisma.PathologyCitationWhereInput = and.length
      ? { AND: and }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.pathologyCitation.findMany({
        where,
        orderBy: [{ verified: 'asc' }, { pathology: { nameVi: 'asc' } }],
        skip: (page - 1) * PAGE,
        take: PAGE,
        select: {
          id: true,
          pageOrSection: true,
          quote: true,
          verified: true,
          verifiedBy: true,
          verifiedAt: true,
          pathology: { select: { id: true, slug: true, nameVi: true } },
          source: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.pathologyCitation.count({ where }),
    ]);
    return { items, total, page, pageSize: PAGE };
  }

  /**
   * Đối chiếu hàng loạt.
   *
   * Cùng trần và cùng lý do với [bulkReview]: đánh dấu "đã đối chiếu với sách"
   * cho 106 trích dẫn bằng một cái tick là nói dối, dù nói dối bằng máy.
   */
  async bulkVerifyCitations(actor: AuthUser, ids: string[], verified: boolean) {
    const unique = [...new Set(ids)];
    if (unique.length === 0)
      throw new BadRequestException('Chưa chọn trích dẫn nào');
    if (unique.length > BULK_MAX) {
      throw new BadRequestException(
        `Mỗi lượt tối đa ${BULK_MAX} trích dẫn — đây là xác nhận đã mở tài liệu ra kiểm, không phải thao tác dọn hàng đợi.`,
      );
    }
    const rows = await this.prisma.pathologyCitation.findMany({
      where: { id: { in: unique } },
      select: { id: true, verified: true, sourceId: true },
    });
    if (rows.length !== unique.length) {
      throw new BadRequestException(
        'Có id không tồn tại trong danh sách gửi lên',
      );
    }
    const changed = rows.filter((r) => r.verified !== verified);
    await this.prisma.pathologyCitation.updateMany({
      where: { id: { in: changed.map((r) => r.id) } },
      data: {
        verified,
        verifiedBy: verified ? actor.email : null,
        verifiedAt: verified ? new Date() : null,
      },
    });
    await this.audit.record({
      actor,
      action: 'verify',
      entity: 'pathology_citation',
      entityId: `bulk:${changed.length}`,
      entityLabel: `${changed.length} trích dẫn · ${verified ? 'đã đối chiếu' : 'bỏ đối chiếu'}`,
      before: { verified: !verified },
      after: { verified, ids: changed.map((r) => r.id) },
    });
    return { updated: changed.length, skipped: rows.length - changed.length };
  }

  // ------------------------------------------------------------- bản dịch

  /**
   * Hàng đợi dịch: bản ĐÍCH đặt cạnh bản gốc tiếng Việt.
   *
   * Người dịch cần hai thứ trên cùng một màn hình. Ở khu Bệnh lý thì phải mở
   * ngăn, bấm tab vi đọc, bấm tab en gõ — đọc một câu là bấm hai lần.
   *
   * `state`:
   * - `missing`  : chưa có bản ghi nào cho ngôn ngữ đó
   * - `machine`  : có, nhưng là dịch máy chưa ai duyệt
   * - `reviewed` : đã có người soạn hoặc duyệt
   */
  async translations(params: {
    locale: string;
    state?: 'missing' | 'machine' | 'reviewed';
    q?: string;
    page?: number;
  }) {
    const locale = params.locale;
    if (!LOCALES.includes(locale as (typeof LOCALES)[number])) {
      throw new BadRequestException(`Ngôn ngữ phải là ${LOCALES.join(' | ')}`);
    }
    if (locale === 'vi') {
      throw new BadRequestException(
        'Tiếng Việt là bản GỐC, không nằm trong hàng đợi dịch.',
      );
    }
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();

    const and: Prisma.PathologyWhereInput[] = [];
    if (q) {
      and.push({
        OR: [
          { nameVi: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (params.state === 'missing') {
      and.push({ content: { none: { locale } } });
    }
    if (params.state === 'machine') {
      and.push({ content: { some: { locale, machineTranslated: true } } });
    }
    if (params.state === 'reviewed') {
      and.push({ content: { some: { locale, machineTranslated: false } } });
    }
    const where: Prisma.PathologyWhereInput = and.length ? { AND: and } : {};

    const [rows, total] = await Promise.all([
      this.prisma.pathology.findMany({
        where,
        orderBy: [{ clinicalSystem: 'asc' }, { nameVi: 'asc' }],
        skip: (page - 1) * PAGE,
        take: PAGE,
        select: {
          id: true,
          slug: true,
          nameVi: true,
          nameEn: true,
          nameZh: true,
          clinicalSystem: true,
          // Lấy CẢ hai bản: gốc để đọc, đích để sửa.
          content: {
            where: { locale: { in: ['vi', locale] } },
            select: {
              locale: true,
              machineTranslated: true,
              description: true,
              clinical: true,
              imaging: true,
              progression: true,
              treatment: true,
            },
          },
        },
      }),
      this.prisma.pathology.count({ where }),
    ]);

    return {
      locale,
      items: rows.map(({ content, ...p }) => {
        const target = content.find((c) => c.locale === locale);
        return {
          ...p,
          source: content.find((c) => c.locale === 'vi') ?? null,
          target: target ?? null,
          state: !target
            ? ('missing' as const)
            : target.machineTranslated
              ? ('machine' as const)
              : ('reviewed' as const),
        };
      }),
      total,
      page,
      pageSize: PAGE,
    };
  }
}
