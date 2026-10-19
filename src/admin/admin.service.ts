import { withRevision } from './revisions';
import {
  REVIEW_INCLUDE,
  reviewReady,
  reviewRevision,
} from './review-readiness';
import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { hasAtLeast, type AuthUser } from '../auth/roles';
import {
  CreateCitationDto,
  LOCALES,
  UpdatePathologyMetaDto,
  UpdateSourceDto,
  UpsertContentDto,
} from './dto/admin.dto';

const PAGE = 25;

/**
 * Cấu trúc thiếu mô tả ở BẤT KỲ ngôn ngữ nào.
 *
 * Mô tả trống có hai dạng trong dữ liệu thật: `NULL` và chuỗi rỗng. Chỉ lọc
 * `NULL` thì bỏ sót đúng những bản ghi đã từng được ghi rồi xoá trắng.
 */
const STRUCTURE_MISSING_DESCRIPTION: Prisma.StructureWhereInput = {
  OR: [
    { descriptionVi: null },
    { descriptionVi: '' },
    { descriptionEn: null },
    { descriptionEn: '' },
    { descriptionZh: null },
    { descriptionZh: '' },
  ],
};

/**
 * Nguồn không còn lấy được toàn văn để đối chiếu.
 *
 * `downloaded` và `official-link` là hai trạng thái lành. Còn lại — liên kết
 * chính thức đã hỏng, cần đăng nhập thư viện, sách thương mại — nghĩa là người
 * duyệt sau này không mở được tài liệu ra mà kiểm.
 */
const SOURCE_AT_RISK: Prisma.MedicalSourceWhereInput = {
  status: { notIn: ['downloaded', 'official-link'] },
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------- tổng quan

  /**
   * Số liệu cho bảng điều khiển.
   *
   * Cố ý đếm cả những thứ CÒN THIẾU, không chỉ những thứ đã có: một trang quản
   * trị chỉ khoe "106 bệnh lý" thì không ai biết trong đó bao nhiêu bài chưa ai
   * duyệt, bao nhiêu bài thiếu bản tiếng Trung. Cái cần nhìn thấy là việc còn
   * phải làm.
   */
  async overview() {
    const [
      pathologies,
      needsReview,
      structures,
      systems,
      species,
      sources,
      quizQuestions,
      users,
      disabledUsers,
      attempts,
      contentByLocale,
      machineTranslated,
      citations,
      unverifiedCitations,
      pathologiesWithoutCitation,
      pathologiesWithoutLesion,
      recentAudit,
    ] = await Promise.all([
      this.prisma.pathology.count(),
      this.prisma.pathology.count({ where: { needsReview: true } }),
      this.prisma.structure.count(),
      this.prisma.anatomySystem.count(),
      this.prisma.species.count(),
      this.prisma.medicalSource.count(),
      this.prisma.quizQuestion.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { disabledAt: { not: null } } }),
      this.prisma.quizAttempt.count(),
      this.prisma.pathologyContent.groupBy({
        by: ['locale'],
        _count: { _all: true },
      }),
      this.prisma.pathologyContent.count({
        where: { machineTranslated: true },
      }),
      this.prisma.pathologyCitation.count(),
      this.prisma.pathologyCitation.count({ where: { verified: false } }),
      this.prisma.pathology.count({ where: { citations: { none: {} } } }),
      this.prisma.pathology.count({ where: { lesionMesh: null } }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const perLocale = Object.fromEntries(
      contentByLocale.map((row) => [row.locale, row._count._all]),
    );

    return {
      content: {
        pathologies,
        needsReview,
        structures,
        systems,
        species,
        sources,
        quizQuestions,
      },
      // Độ phủ ngôn ngữ tính theo SỐ BỆNH, không theo số bản ghi: "318 bản ghi"
      // nghe thì nhiều, mà nếu dồn hết vào tiếng Việt thì hai thứ tiếng kia vẫn
      // trống trơn.
      locales: LOCALES.map((locale) => ({
        locale,
        filled: perLocale[locale] ?? 0,
        missing: pathologies - (perLocale[locale] ?? 0),
      })),
      quality: {
        machineTranslated,
        citations,
        unverifiedCitations,
        pathologiesWithoutCitation,
        pathologiesWithoutLesion,
      },
      people: { users, disabledUsers, attempts },
      recentAudit,
      attention: await this.attention(),
    };
  }

  /** Số mục mẫu kèm theo mỗi hạng mục tồn đọng. */
  private static readonly SAMPLE = 5;

  /**
   * Từng hạng mục việc TỒN ĐỌNG, kèm vài mục cụ thể để bấm vào được.
   *
   * Con số một mình không dùng được: "106 bài chưa duyệt" thì người ngồi đây
   * vẫn phải mở tab khác, lọc, rồi mới bắt đầu. Trả kèm năm mục đầu là bảng
   * điều khiển thành chỗ BẮT ĐẦU LÀM VIỆC chứ không phải chỗ đọc báo cáo.
   *
   * Chỉ trả DỮ LIỆU, không trả tiêu đề hay màu: chữ nghĩa và cách tô là việc
   * của giao diện. Nhét tiêu đề vào đây là muốn sửa một nhãn cũng phải deploy
   * lại backend.
   */
  private async attention() {
    const take = AdminService.SAMPLE;

    const [
      needsReview,
      needsReviewItems,
      unverifiedCitations,
      unverifiedCitationItems,
      machineTranslated,
      machineTranslatedItems,
      withoutStructure,
      withoutStructureItems,
      withoutCitation,
      withoutCitationItems,
      structuresMissingDesc,
      structuresMissingDescItems,
      sourcesAtRisk,
      sourcesAtRiskItems,
    ] = await Promise.all([
      this.prisma.pathology.count({ where: { needsReview: true } }),
      this.prisma.pathology.findMany({
        where: { needsReview: true },
        orderBy: [{ clinicalSystem: 'asc' }, { nameVi: 'asc' }],
        take,
        select: { id: true, slug: true, nameVi: true, clinicalSystem: true },
      }),

      this.prisma.pathologyCitation.count({ where: { verified: false } }),
      this.prisma.pathologyCitation.findMany({
        where: { verified: false },
        orderBy: { pathology: { nameVi: 'asc' } },
        take,
        select: {
          id: true,
          pageOrSection: true,
          pathology: { select: { id: true, slug: true, nameVi: true } },
          source: { select: { title: true } },
        },
      }),

      this.prisma.pathologyContent.count({
        where: { machineTranslated: true },
      }),
      this.prisma.pathologyContent.findMany({
        where: { machineTranslated: true },
        orderBy: [{ locale: 'asc' }, { pathology: { nameVi: 'asc' } }],
        take,
        select: {
          id: true,
          locale: true,
          pathology: { select: { id: true, slug: true, nameVi: true } },
        },
      }),

      this.prisma.pathology.count({ where: { structureId: null } }),
      this.prisma.pathology.findMany({
        where: { structureId: null },
        orderBy: { nameVi: 'asc' },
        take,
        select: { id: true, slug: true, nameVi: true, clinicalSystem: true },
      }),

      this.prisma.pathology.count({ where: { citations: { none: {} } } }),
      this.prisma.pathology.findMany({
        where: { citations: { none: {} } },
        orderBy: { nameVi: 'asc' },
        take,
        select: { id: true, slug: true, nameVi: true, source: true },
      }),

      // Cấu trúc thiếu mô tả ở BẤT KỲ ngôn ngữ nào. Trống có hai dạng trong dữ
      // liệu thật — NULL và chuỗi rỗng — nên phải bắt cả hai.
      this.prisma.structure.count({ where: STRUCTURE_MISSING_DESCRIPTION }),
      this.prisma.structure.findMany({
        where: STRUCTURE_MISSING_DESCRIPTION,
        orderBy: { nameVi: 'asc' },
        take,
        select: {
          id: true,
          code: true,
          nameVi: true,
          descriptionVi: true,
          descriptionEn: true,
          descriptionZh: true,
          system: { select: { nameVi: true } },
        },
      }),

      // Nguồn không còn lấy được toàn văn: liên kết chính thức đã hỏng, hoặc
      // cần đăng nhập thư viện. Bệnh nào dựa vào đó thì không ai kiểm chứng lại
      // được, nên đây là việc tồn chứ không phải ghi chú.
      this.prisma.medicalSource.count({ where: SOURCE_AT_RISK }),
      this.prisma.medicalSource.findMany({
        where: SOURCE_AT_RISK,
        orderBy: { title: 'asc' },
        take,
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { citations: true } },
        },
      }),
    ]);

    return {
      needsReview: {
        total: needsReview,
        items: needsReviewItems.map((p) => ({
          id: p.id,
          title: p.nameVi,
          subtitle: [p.slug, p.clinicalSystem].filter(Boolean).join(' · '),
        })),
      },
      unverifiedCitations: {
        total: unverifiedCitations,
        items: unverifiedCitationItems.map((c) => ({
          id: c.pathology.id,
          title: c.pathology.nameVi,
          subtitle: [c.source.title, c.pageOrSection]
            .filter(Boolean)
            .join(' · '),
        })),
      },
      machineTranslated: {
        total: machineTranslated,
        items: machineTranslatedItems.map((c) => ({
          id: c.pathology.id,
          title: c.pathology.nameVi,
          subtitle: `bản ${c.locale} · ${c.pathology.slug}`,
        })),
      },
      withoutStructure: {
        total: withoutStructure,
        items: withoutStructureItems.map((p) => ({
          id: p.id,
          title: p.nameVi,
          subtitle: [p.slug, p.clinicalSystem].filter(Boolean).join(' · '),
        })),
      },
      withoutCitation: {
        total: withoutCitation,
        items: withoutCitationItems.map((p) => ({
          id: p.id,
          title: p.nameVi,
          subtitle: p.source,
        })),
      },
      structuresMissingDescription: {
        total: structuresMissingDesc,
        items: structuresMissingDescItems.map((st) => ({
          id: st.id,
          title: st.nameVi,
          subtitle: `${st.system.nameVi} · thiếu ${LOCALES.filter(
            (locale) =>
              !(locale === 'vi'
                ? st.descriptionVi
                : locale === 'en'
                  ? st.descriptionEn
                  : st.descriptionZh),
          ).join('/')}`,
        })),
      },
      sourcesAtRisk: {
        total: sourcesAtRisk,
        items: sourcesAtRiskItems.map((src) => ({
          id: src.id,
          title: src.title,
          subtitle: `${src.status} · ${src._count.citations} trích dẫn đang dựa vào`,
        })),
      },
    };
  }

  // -------------------------------------------------------------- người dùng

  async users(params: { q?: string; page?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE,
        take: PAGE,
        // Không chọn `passwordHash` dù chỉ là băm: back office không có việc gì
        // cần tới nó, mà đã ra khỏi máy chủ thì còn nằm trong log, trong bộ nhớ
        // đệm trình duyệt, trong ảnh chụp màn hình của người khác.
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          disabledAt: true,
          createdAt: true,
          googleId: true,
          githubId: true,
          facebookId: true,
          _count: {
            select: {
              quizAttempts: true,
              personalDocs: true,
              reviewItems: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows.map(({ googleId, githubId, facebookId, ...user }) => ({
        ...user,
        providers: [
          googleId ? 'google' : null,
          githubId ? 'github' : null,
          facebookId ? 'facebook' : null,
        ].filter((p): p is string => p !== null),
      })),
      total,
      page,
      pageSize: PAGE,
    };
  }

  /**
   * Đổi vai của một tài khoản.
   *
   * Ba chốt chặn, mỗi chốt vá một cách tự bắn vào chân mình: không tự đổi vai
   * của chính mình (tự hạ quyền là mất luôn lối vào, phải chạy lại lệnh CLI mới
   * gỡ được), không đụng tới người ngang hoặc trên bậc mình, và không cấp vai
   * cao hơn bậc của chính mình.
   */
  async setRole(actor: AuthUser, id: string, role: UserRole) {
    return this.audit.atomic(async (tx) => {
      const target = await this.requireUser(id, tx);
      if (target.id === actor.id) {
        throw new ForbiddenException('Không thể tự đổi quyền của chính mình');
      }
      if (hasAtLeast(target.role, actor.role)) {
        throw new ForbiddenException(
          'Không thể đổi quyền của tài khoản ngang hoặc cao hơn bạn',
        );
      }
      if (role !== UserRole.user && hasAtLeast(role, actor.role)) {
        throw new ForbiddenException(
          'Không thể cấp quyền cao hơn quyền của bạn',
        );
      }
      const updated = await tx.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });
      await this.audit.record(
        {
          actor,
          action: 'role_change',
          entity: 'user',
          entityId: id,
          entityLabel: target.email,
          before: { role: target.role },
          after: { role },
        },
        tx,
      );
      return updated;
    });
  }

  async setDisabled(actor: AuthUser, id: string, disabled: boolean) {
    return this.audit.atomic(async (tx) => {
      const target = await this.requireUser(id, tx);
      if (target.id === actor.id) {
        throw new ForbiddenException(
          'Không thể tự khoá tài khoản của chính mình',
        );
      }
      if (hasAtLeast(target.role, actor.role)) {
        throw new ForbiddenException(
          'Không thể khoá tài khoản ngang hoặc cao hơn bạn',
        );
      }
      const disabledAt = disabled ? new Date() : null;
      const updated = await tx.user.update({
        where: { id },
        data: { disabledAt },
        select: { id: true, email: true, disabledAt: true },
      });
      // Khoá xong phải cắt hết phiên đang mở, nếu không người bị khoá vẫn dùng
      // tiếp bằng token cũ cho tới khi nó hết hạn — tức là tới 30 ngày.
      if (disabled) {
        await tx.session.deleteMany({ where: { userId: id } });
      }
      await this.audit.record(
        {
          actor,
          action: disabled ? 'disable' : 'enable',
          entity: 'user',
          entityId: id,
          entityLabel: target.email,
          before: { disabledAt: target.disabledAt },
          after: { disabledAt },
        },
        tx,
      );
      return updated;
    });
  }

  private async requireUser(
    id: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const user = await client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không có tài khoản này');
    return user;
  }

  // ---------------------------------------------------------------- bệnh lý

  /**
   * Danh sách bệnh lý cho back office, kèm những chỗ CÒN HỔNG của từng bệnh.
   *
   * Khác `GET /api/pathologies` dành cho người đọc: ở đây không cần toàn văn
   * nội dung (nặng, mà bảng cũng không hiển thị), nhưng cần biết ngay bệnh nào
   * thiếu bản dịch, thiếu trích dẫn, chưa ai duyệt.
   */
  async pathologies(params: {
    q?: string;
    clinicalSystem?: string;
    needsReview?: boolean;
    missingLocale?: string;
    page?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();
    const where: Prisma.PathologyWhereInput = {
      ...(q
        ? {
            OR: [
              { nameVi: { contains: q, mode: 'insensitive' } },
              { nameEn: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { icdCode: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.clinicalSystem
        ? { clinicalSystem: params.clinicalSystem }
        : {}),
      ...(params.needsReview === undefined
        ? {}
        : { needsReview: params.needsReview }),
      ...(params.missingLocale
        ? { content: { none: { locale: params.missingLocale } } }
        : {}),
    };

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
          icdCode: true,
          severity: true,
          clinicalSystem: true,
          needsReview: true,
          lesionMesh: true,
          lesionSystem: true,
          source: true,
          sourcePage: true,
          structure: { select: { code: true, nameVi: true } },
          content: { select: { locale: true, machineTranslated: true } },
          _count: { select: { citations: true } },
        },
      }),
      this.prisma.pathology.count({ where }),
    ]);

    return {
      items: rows.map(({ content, _count, ...pathology }) => ({
        ...pathology,
        citations: _count.citations,
        locales: content.map((c) => c.locale),
        missingLocales: LOCALES.filter(
          (locale) => !content.some((c) => c.locale === locale),
        ),
        machineLocales: content
          .filter((c) => c.machineTranslated)
          .map((c) => c.locale),
      })),
      total,
      page,
      pageSize: PAGE,
    };
  }

  /** Hệ lâm sàng đang thực có trong dữ liệu — đổ vào bộ lọc thay vì viết cứng. */
  async clinicalSystems() {
    const rows = await this.prisma.pathology.groupBy({
      by: ['clinicalSystem'],
      _count: { _all: true },
      orderBy: { clinicalSystem: 'asc' },
    });
    return rows
      .filter((row) => row.clinicalSystem !== null)
      .map((row) => ({
        name: row.clinicalSystem as string,
        count: row._count._all,
      }));
  }

  async pathology(id: string) {
    const pathology = await this.prisma.pathology.findUnique({
      where: { id },
      include: {
        structure: { select: { id: true, code: true, nameVi: true } },
        content: { orderBy: { locale: 'asc' } },
        citations: {
          include: { source: true },
          orderBy: { source: { year: 'desc' } },
        },
        relatedStructures: {
          include: {
            structure: { select: { id: true, code: true, nameVi: true } },
          },
        },
      },
    });
    if (!pathology) throw new NotFoundException('Không có bệnh lý này');
    return {
      reviewRevision: reviewRevision(pathology),
      ...withRevision('pathology', pathology),
      content: pathology.content.map((row) =>
        withRevision('pathology_content', row),
      ),
    };
  }

  /**
   * Sửa các trường của chính bản ghi bệnh lý (tên, ICD, mức độ, hệ lâm sàng).
   *
   * Đi qua đây chứ không qua `PATCH /api/pathologies/:id` vì endpoint kia không
   * ghi nhật ký. Với nội dung y khoa thì "ai đổi mức độ nặng của bệnh này" là
   * câu hỏi phải trả lời được.
   */
  async updatePathology(
    actor: AuthUser,
    id: string,
    dto: UpdatePathologyMetaDto,
  ) {
    return this.audit.update(actor, 'pathology', id, dto);
  }

  async upsertContent(
    actor: AuthUser,
    id: string,
    locale: string,
    dto: UpsertContentDto,
  ) {
    if (!LOCALES.includes(locale as (typeof LOCALES)[number]))
      throw new BadRequestException('Ngôn ngữ không hợp lệ');
    const { expectedRevision, ...data } = dto;
    return this.audit.atomic(async (tx) => {
      const pathology = await tx.pathology.findUnique({ where: { id } });
      if (!pathology) throw new NotFoundException('Không có bệnh lý này');
      const before = await tx.pathologyContent.findUnique({
        where: { pathologyId_locale: { pathologyId: id, locale } },
      });
      this.audit.assertRevision('pathology_content', before, expectedRevision);
      const after = await tx.pathologyContent.upsert({
        where: { pathologyId_locale: { pathologyId: id, locale } },
        update: data,
        create: { pathologyId: id, locale, machineTranslated: false, ...data },
      });
      await tx.pathology.update({ where: { id }, data: { needsReview: true } });
      await this.audit.record(
        {
          actor,
          action: before ? 'update' : 'create',
          entity: 'pathology_content',
          entityId: after.id,
          entityLabel: pathology.slug + ' [' + locale + ']',
          before,
          after,
        },
        tx,
      );
      return withRevision('pathology_content', after);
    });
  }

  async setReviewed(
    actor: AuthUser,
    id: string,
    needsReview: boolean,
    expectedReviewRevision: string,
  ) {
    return this.audit.atomic(async (tx) => {
      const before = await tx.pathology.findUnique({
        where: { id },
        include: REVIEW_INCLUDE,
      });
      if (!before) throw new NotFoundException('Không có bệnh lý này');
      if (reviewRevision(before) !== expectedReviewRevision)
        throw new ConflictException(
          'Bài đã thay đổi sau khi mở. Tải lại và đọc bản mới trước khi duyệt.',
        );
      if (!needsReview && !reviewReady(before))
        throw new BadRequestException(
          'Cần nội dung tiếng Việt đã soạn và ít nhất một trích dẫn đã đối chiếu từ nguồn đang sử dụng.',
        );
      const after = await tx.pathology.update({
        where: { id },
        data: { needsReview },
      });
      await this.audit.record(
        {
          actor,
          action: 'verify',
          entity: 'pathology',
          entityId: id,
          entityLabel: before.slug,
          before: { needsReview: before.needsReview },
          after: { needsReview },
        },
        tx,
      );
      return withRevision('pathology', after);
    });
  }

  // --------------------------------------------------------------- trích dẫn

  async addCitation(
    actor: AuthUser,
    pathologyId: string,
    dto: CreateCitationDto,
  ) {
    return this.audit.atomic(async (tx) => {
      const [pathology, source] = await Promise.all([
        tx.pathology.findUnique({
          where: { id: pathologyId },
          select: { id: true, slug: true },
        }),
        tx.medicalSource.findUnique({ where: { id: dto.sourceId } }),
      ]);
      if (!pathology) throw new NotFoundException('Không có bệnh lý này');
      if (!source || source.status === 'archived') {
        throw new BadRequestException(
          `Nguồn "${dto.sourceId}" chưa có trong danh mục tài liệu`,
        );
      }
      const pageOrSection = dto.pageOrSection?.trim() || null;
      const duplicate = await tx.pathologyCitation.findFirst({
        where: { pathologyId, sourceId: dto.sourceId, pageOrSection },
      });
      if (duplicate) throw new BadRequestException('Trích dẫn này đã có');

      const citation = await tx.pathologyCitation.create({
        data: {
          pathologyId,
          sourceId: dto.sourceId,
          pageOrSection,
          quote: dto.quote?.trim() || null,
        },
        include: { source: true },
      });
      await tx.pathology.update({
        where: { id: pathologyId },
        data: { needsReview: true },
      });
      await this.audit.record(
        {
          actor,
          action: 'create',
          entity: 'pathology_citation',
          entityId: citation.id,
          entityLabel: `${pathology.slug} ← ${source.id}`,
          after: { sourceId: dto.sourceId, pageOrSection },
        },
        tx,
      );
      return citation;
    });
  }

  /**
   * Đánh dấu một trích dẫn đã được người có chuyên môn đối chiếu với sách.
   *
   * Ghi luôn ai duyệt và duyệt lúc nào: một cái tick không có tên người đứng
   * sau thì chẳng khác gì không tick.
   */
  async verifyCitation(actor: AuthUser, id: string, verified: boolean) {
    return this.audit.atomic(async (tx) => {
      const before = await tx.pathologyCitation.findUnique({
        where: { id },
        include: { pathology: { select: { slug: true } } },
      });
      if (!before) throw new NotFoundException('Không có trích dẫn này');
      const after = await tx.pathologyCitation.update({
        where: { id },
        data: {
          verified,
          verifiedBy: verified ? actor.email : null,
          verifiedAt: verified ? new Date() : null,
        },
        include: { source: true },
      });
      await tx.pathology.update({
        where: { id: before.pathologyId },
        data: { needsReview: true },
      });
      await this.audit.record(
        {
          actor,
          action: 'verify',
          entity: 'pathology_citation',
          entityId: id,
          entityLabel: `${before.pathology.slug} ← ${before.sourceId}`,
          before: { verified: before.verified },
          after: { verified },
        },
        tx,
      );
      return after;
    });
  }

  async removeCitation(actor: AuthUser, id: string) {
    return this.audit.atomic(async (tx) => {
      const before = await tx.pathologyCitation.findUnique({
        where: { id },
        include: { pathology: { select: { slug: true } } },
      });
      if (!before) throw new NotFoundException('Không có trích dẫn này');
      await tx.pathologyCitation.delete({ where: { id } });
      await tx.pathology.update({
        where: { id: before.pathologyId },
        data: { needsReview: true },
      });
      await this.audit.record(
        {
          actor,
          action: 'delete',
          entity: 'pathology_citation',
          entityId: id,
          entityLabel: `${before.pathology.slug} ← ${before.sourceId}`,
          before,
        },
        tx,
      );
      return { deleted: true, id };
    });
  }

  // ------------------------------------------------------------------- nguồn

  sources() {
    return this.prisma.medicalSource
      .findMany({
        orderBy: [{ year: 'desc' }, { title: 'asc' }],
        include: { _count: { select: { citations: true } } },
      })
      .then((rows) => rows.map((row) => withRevision('medical_source', row)));
  }

  async updateSource(actor: AuthUser, id: string, dto: UpdateSourceDto) {
    return this.audit.update(actor, 'medical_source', id, dto);
  }
}
