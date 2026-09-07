import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import type { AuthUser } from '../auth/roles';
import {
  LinkStructureDto,
  UpdateQuizDto,
  UpdateQuizOptionDto,
  AdminUpdateSpeciesDto,
  AdminUpdateStructureDto,
  UpdateSystemDto,
} from './dto/admin.dto';

const PAGE = 25;

/**
 * Phần quản trị dữ liệu giải phẫu và trắc nghiệm.
 *
 * Tách khỏi `AdminService` (bệnh lý, tài khoản, nguồn) vì đó đã là tệp dài
 * nhất của backend; gộp thêm bốn thực thể nữa thì không ai đọc lại được.
 *
 * Mọi thao tác ghi đều đi qua đây chứ không qua `PATCH /api/species/:code` và
 * họ hàng của nó: các endpoint kia không ghi nhật ký. Với nội dung giải phẫu ba
 * ngôn ngữ thì "ai đổi tên Latin của cấu trúc này" là câu hỏi phải trả lời được.
 */
@Injectable()
export class AnatomyAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------------- loài

  async species() {
    const rows = await this.prisma.species.findMany({
      orderBy: { nameVi: 'asc' },
      include: { _count: { select: { systems: true, structures: true } } },
    });
    return rows.map(({ _count, ...species }) => ({
      ...species,
      systems: _count.systems,
      structures: _count.structures,
    }));
  }

  async updateSpecies(actor: AuthUser, id: string, dto: AdminUpdateSpeciesDto) {
    const before = await this.prisma.species.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Không có loài này');
    const after = await this.prisma.species.update({
      where: { id },
      data: dto,
    });
    await this.audit.record({
      actor,
      action: 'update',
      entity: 'species',
      entityId: id,
      entityLabel: before.code,
      before: this.changedOnly(before, dto),
      after: dto,
    });
    return after;
  }

  // -------------------------------------------------------------- hệ cơ quan

  async systems(params: { speciesId?: string; q?: string }) {
    const q = params.q?.trim();
    const rows = await this.prisma.anatomySystem.findMany({
      where: {
        ...(params.speciesId ? { speciesId: params.speciesId } : {}),
        ...(q
          ? {
              OR: [
                { nameVi: { contains: q, mode: 'insensitive' } },
                { nameEn: { contains: q, mode: 'insensitive' } },
                { code: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [
        { species: { nameVi: 'asc' } },
        { order: 'asc' },
        { nameVi: 'asc' },
      ],
      include: {
        species: { select: { id: true, code: true, nameVi: true } },
        _count: { select: { structures: true, quizzes: true } },
      },
    });
    return rows.map(({ _count, ...system }) => ({
      ...system,
      structures: _count.structures,
      quizzes: _count.quizzes,
    }));
  }

  async updateSystem(actor: AuthUser, id: string, dto: UpdateSystemDto) {
    const before = await this.prisma.anatomySystem.findUnique({
      where: { id },
    });
    if (!before) throw new NotFoundException('Không có hệ cơ quan này');
    const after = await this.prisma.anatomySystem.update({
      where: { id },
      data: dto,
    });
    await this.audit.record({
      actor,
      action: 'update',
      entity: 'anatomy_system',
      entityId: id,
      entityLabel: before.code,
      before: this.changedOnly(before, dto),
      after: dto,
    });
    return after;
  }

  // ---------------------------------------------------------------- cấu trúc

  async structures(params: {
    q?: string;
    systemId?: string;
    speciesId?: string;
    /** Chỉ lấy cấu trúc còn thiếu mô tả ở ngôn ngữ này. */
    missingDescription?: string;
    page?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();
    const missing = params.missingDescription;
    /*
     * Gom điều kiện vào `AND` chứ không spread phẳng.
     *
     * Đã trả giá: cả bộ lọc tìm kiếm và bộ lọc "thiếu mô tả" đều sinh ra một
     * khoá `OR`, mà spread hai object cùng khoá thì cái sau GHI ĐÈ cái trước —
     * lọc kết hợp lặng lẽ bỏ mất một nửa điều kiện và trả về kết quả sai mà
     * không có lỗi nào báo ra.
     *
     * Mô tả trống có hai dạng trong dữ liệu thật: NULL và chuỗi rỗng. Chỉ lọc
     * NULL thì bỏ sót đúng những bản ghi đã từng được ghi rồi xoá trắng.
     */
    const missingClause: Record<string, Prisma.StructureWhereInput> = {
      vi: { OR: [{ descriptionVi: null }, { descriptionVi: '' }] },
      en: { OR: [{ descriptionEn: null }, { descriptionEn: '' }] },
      zh: { OR: [{ descriptionZh: null }, { descriptionZh: '' }] },
    };
    const and: Prisma.StructureWhereInput[] = [];
    if (q) {
      and.push({
        OR: [
          { nameVi: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { latin: { contains: q, mode: 'insensitive' } },
          { meshName: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (params.systemId) and.push({ systemId: params.systemId });
    if (params.speciesId) and.push({ speciesId: params.speciesId });
    if (missing && missingClause[missing]) and.push(missingClause[missing]);
    const where: Prisma.StructureWhereInput = and.length ? { AND: and } : {};

    const [items, total] = await Promise.all([
      this.prisma.structure.findMany({
        where,
        orderBy: [{ nameVi: 'asc' }],
        skip: (page - 1) * PAGE,
        take: PAGE,
        select: {
          id: true,
          code: true,
          meshName: true,
          nameVi: true,
          nameEn: true,
          nameZh: true,
          latin: true,
          taCode: true,
          descriptionVi: true,
          descriptionEn: true,
          descriptionZh: true,
          system: { select: { id: true, code: true, nameVi: true } },
          species: { select: { id: true, code: true, nameVi: true } },
          parent: { select: { code: true, nameVi: true } },
          _count: { select: { children: true, pathologies: true } },
        },
      }),
      this.prisma.structure.count({ where }),
    ]);

    return {
      items: items.map(({ _count, ...structure }) => ({
        ...structure,
        children: _count.children,
        pathologies: _count.pathologies,
      })),
      total,
      page,
      pageSize: PAGE,
    };
  }

  async updateStructure(
    actor: AuthUser,
    id: string,
    dto: AdminUpdateStructureDto,
  ) {
    const before = await this.prisma.structure.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Không có cấu trúc này');
    const after = await this.prisma.structure.update({
      where: { id },
      data: dto,
    });
    await this.audit.record({
      actor,
      action: 'update',
      entity: 'structure',
      entityId: id,
      entityLabel: before.code,
      before: this.changedOnly(before, dto),
      after: dto,
    });
    return after;
  }

  /**
   * Neo một bệnh lý vào cấu trúc 3D, hoặc bỏ neo.
   *
   * Nhận MÃ cấu trúc chứ không nhận id: mã là thứ người soạn đọc được và đối
   * chiếu được với dữ liệu scene, còn cuid thì không ai nhớ nổi.
   */
  async linkPathologyStructure(
    actor: AuthUser,
    pathologyId: string,
    dto: LinkStructureDto,
  ) {
    const before = await this.prisma.pathology.findUnique({
      where: { id: pathologyId },
      select: { id: true, slug: true, structure: { select: { code: true } } },
    });
    if (!before) throw new NotFoundException('Không có bệnh lý này');

    const code = dto.structureCode?.trim();
    let structureId: string | null = null;
    if (code) {
      const structure = await this.prisma.structure.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!structure) {
        throw new BadRequestException(`Không có cấu trúc mã "${code}"`);
      }
      structureId = structure.id;
    }

    const after = await this.prisma.pathology.update({
      where: { id: pathologyId },
      data: { structureId },
      select: {
        id: true,
        slug: true,
        structure: { select: { code: true, nameVi: true } },
      },
    });
    await this.audit.record({
      actor,
      action: 'update',
      entity: 'pathology',
      entityId: pathologyId,
      entityLabel: before.slug,
      before: { structureCode: before.structure?.code ?? null },
      after: { structureCode: code ?? null },
    });
    return after;
  }

  /**
   * Thêm một cấu trúc PHỤ mà bệnh còn ảnh hưởng tới.
   *
   * Khác `structureId` (cấu trúc chính, một-một): bảng này là nhiều-nhiều, dành
   * cho bệnh tổn thương đa cơ quan — lupus ban đỏ hệ thống, suy tim, đái tháo
   * đường. Schema dựng sẵn từ đầu nhưng chưa có lối nào nhập, nên tới giờ vẫn
   * trống 0 dòng.
   */
  async addRelatedStructure(
    actor: AuthUser,
    pathologyId: string,
    structureCode: string,
  ) {
    const code = structureCode.trim();
    if (!code) throw new BadRequestException('Thiếu mã cấu trúc');

    const [pathology, structure] = await Promise.all([
      this.prisma.pathology.findUnique({
        where: { id: pathologyId },
        select: { id: true, slug: true, structureId: true },
      }),
      this.prisma.structure.findUnique({
        where: { code },
        select: { id: true, nameVi: true },
      }),
    ]);
    if (!pathology) throw new NotFoundException('Không có bệnh lý này');
    if (!structure) {
      throw new BadRequestException(`Không có cấu trúc mã "${code}"`);
    }
    // Cấu trúc CHÍNH không được lặp lại ở danh sách phụ: giao diện sẽ hiện cùng
    // một cơ quan hai lần và người đọc tưởng đó là hai tổn thương khác nhau.
    if (pathology.structureId === structure.id) {
      throw new BadRequestException(
        'Cấu trúc này đang là cấu trúc chính của bệnh, không cần thêm lại',
      );
    }
    const existing = await this.prisma.pathologyStructure.findUnique({
      where: {
        pathologyId_structureId: { pathologyId, structureId: structure.id },
      },
    });
    if (existing)
      throw new BadRequestException('Cấu trúc này đã có trong danh sách');

    await this.prisma.pathologyStructure.create({
      data: { pathologyId, structureId: structure.id },
    });
    await this.audit.record({
      actor,
      action: 'create',
      entity: 'pathology_structure',
      entityId: `${pathologyId}:${structure.id}`,
      entityLabel: `${pathology.slug} ← ${code}`,
      after: { structureCode: code },
    });
    return { added: true, structure: { code, nameVi: structure.nameVi } };
  }

  async removeRelatedStructure(
    actor: AuthUser,
    pathologyId: string,
    structureId: string,
  ) {
    const link = await this.prisma.pathologyStructure.findUnique({
      where: { pathologyId_structureId: { pathologyId, structureId } },
      include: {
        pathology: { select: { slug: true } },
        structure: { select: { code: true } },
      },
    });
    if (!link) throw new NotFoundException('Không có liên kết này');

    await this.prisma.pathologyStructure.delete({
      where: { pathologyId_structureId: { pathologyId, structureId } },
    });
    await this.audit.record({
      actor,
      action: 'delete',
      entity: 'pathology_structure',
      entityId: `${pathologyId}:${structureId}`,
      entityLabel: `${link.pathology.slug} ← ${link.structure.code}`,
      before: { structureCode: link.structure.code },
    });
    return { deleted: true };
  }

  // -------------------------------------------------------------- trắc nghiệm

  async quizzes(params: { systemId?: string; q?: string; page?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const q = params.q?.trim();
    const where: Prisma.QuizQuestionWhereInput = {
      ...(params.systemId ? { systemId: params.systemId } : {}),
      ...(q
        ? {
            OR: [
              { promptVi: { contains: q, mode: 'insensitive' } },
              { promptEn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.quizQuestion.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * PAGE,
        take: PAGE,
        include: {
          system: { select: { id: true, code: true, nameVi: true } },
          options: { orderBy: { id: 'asc' } },
        },
      }),
      this.prisma.quizQuestion.count({ where }),
    ]);
    return { items, total, page, pageSize: PAGE };
  }

  async updateQuiz(actor: AuthUser, id: string, dto: UpdateQuizDto) {
    const before = await this.prisma.quizQuestion.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Không có câu hỏi này');
    const after = await this.prisma.quizQuestion.update({
      where: { id },
      data: dto,
      include: { options: { orderBy: { id: 'asc' } } },
    });
    await this.audit.record({
      actor,
      action: 'update',
      entity: 'quiz_question',
      entityId: id,
      entityLabel: before.promptVi.slice(0, 80),
      before: this.changedOnly(before, dto),
      after: dto,
    });
    return after;
  }

  /**
   * Sửa một phương án.
   *
   * Đặt `isCorrect = true` sẽ tự bỏ đúng ở mọi phương án khác của cùng câu, làm
   * trong MỘT giao dịch. Không có bước đó thì một câu có thể có hai đáp án đúng
   * — trạng thái mà cả trang làm bài lẫn phần tính điểm đều không xử lý được, và
   * người học chỉ thấy mình trả lời đúng mà vẫn bị tính sai.
   */
  async updateQuizOption(
    actor: AuthUser,
    id: string,
    dto: UpdateQuizOptionDto,
  ) {
    const before = await this.prisma.quizOption.findUnique({
      where: { id },
      include: { question: { select: { promptVi: true } } },
    });
    if (!before) throw new NotFoundException('Không có phương án này');

    const after = await this.prisma.$transaction(async (tx) => {
      if (dto.isCorrect === true) {
        await tx.quizOption.updateMany({
          where: { questionId: before.questionId, id: { not: id } },
          data: { isCorrect: false },
        });
      }
      return tx.quizOption.update({ where: { id }, data: dto });
    });

    await this.audit.record({
      actor,
      action: 'update',
      entity: 'quiz_option',
      entityId: id,
      entityLabel: `${before.question.promptVi.slice(0, 60)} → ${before.textVi.slice(0, 40)}`,
      before: this.changedOnly(before, dto),
      after: dto,
    });
    return after;
  }

  /**
   * Chỉ chụp lại những trường THẬT SỰ được gửi lên.
   *
   * Nhét cả bản ghi vào nhật ký thì mỗi lần sửa một dấu phẩy lại sinh ra một
   * khối JSON không đọc nổi, và cái cần so sánh bị chìm trong đó.
   */
  private changedOnly(before: object, dto: object) {
    const source = before as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(dto).map((key) => [key, source[key]]),
    );
  }
}
