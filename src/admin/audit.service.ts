import { validateSourceMetadata } from './source-metadata';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/roles';
import {
  EDIT_FIELDS,
  EDIT_MODELS,
  revisionOf,
  withRevision,
  type EditableEntity,
} from './revisions';

/** Số bản ghi nhật ký trả về mỗi trang. */
const PAGE = 50;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async atomic<T>(
    run: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(run, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2002'].includes(error.code)
      )
        throw new ConflictException(
          'Dữ liệu vừa được người khác sửa. Bản đang nhập vẫn được giữ; tải lại để đối chiếu.',
        );
      throw error;
    }
  }

  assertRevision(
    entity: EditableEntity,
    before: object | null,
    expected: string,
  ) {
    if (!expected || revisionOf(entity, before) !== expected)
      throw new ConflictException(
        'Phiên bản đã thay đổi. Bản đang nhập vẫn được giữ; đối chiếu với bản mới trước khi lưu.',
      );
  }

  async update(
    actor: AuthUser,
    entity: EditableEntity,
    id: string,
    input: object & { expectedRevision: string },
    action = 'update',
  ) {
    const { expectedRevision, ...data } = input;
    for (const key of ['nameVi', 'promptVi']) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === 'string' && !value.trim())
        throw new BadRequestException(
          'Nội dung tiếng Việt không được để trống',
        );
    }
    const allowed = new Set<string>(EDIT_FIELDS[entity]);
    if (Object.keys(data).some((key) => !allowed.has(key)))
      throw new BadRequestException('Trường cập nhật không được hỗ trợ');
    for (const [key, value] of Object.entries(data)) {
      if (
        value === null &&
        ![
          'latin',
          'icdCode',
          'severity',
          'clinicalSystem',
          'sourcePage',
          'description',
          'clinical',
          'imaging',
          'progression',
          'treatment',
          'taCode',
          'descriptionVi',
          'descriptionEn',
          'descriptionZh',
          'explanation',
          'year',
          'licenseNote',
        ].includes(key) &&
        !(entity === 'quiz_question' && key === 'source')
      )
        throw new BadRequestException('Trường ' + key + ' không được để trống');
    }
    return this.atomic(async (tx) => {
      const model = tx[EDIT_MODELS[entity]] as unknown as {
        findUnique: (args: {
          where: { id: string };
        }) => Promise<Record<string, unknown> | null>;
        update: (args: {
          where: { id: string };
          data: object;
        }) => Promise<Record<string, unknown>>;
      };
      const before = await model.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('Bản ghi không còn tồn tại');
      this.assertRevision(entity, before, expectedRevision);
      if (entity === 'medical_source') validateSourceMetadata(data);
      if (entity === 'pathology') Object.assign(data, { needsReview: true });
      if (entity === 'quiz_option') {
        const questionId = String(before.questionId);
        if (
          'isCorrect' in data &&
          data.isCorrect === false &&
          before.isCorrect === true
        )
          throw new BadRequestException(
            'Chọn một phương án đúng khác thay vì bỏ đáp án đúng cuối cùng.',
          );
        if ('isCorrect' in data && data.isCorrect === true) {
          const siblings = await tx.quizOption.findMany({
            where: { questionId, id: { not: id }, isCorrect: true },
          });
          for (const sibling of siblings) {
            const changed = await tx.quizOption.update({
              where: { id: sibling.id },
              data: { isCorrect: false },
            });
            await this.record(
              {
                actor,
                action: 'update',
                entity: 'quiz_option',
                entityId: sibling.id,
                before: sibling,
                after: changed,
              },
              tx,
            );
          }
        }
      }
      const after = await model.update({
        where: { id },
        data:
          entity === 'medical_source'
            ? { ...data, checkedAt: new Date() }
            : data,
      });
      if (
        entity === 'medical_source' &&
        'status' in data &&
        data.status === 'archived'
      )
        await tx.pathology.updateMany({
          where: { citations: { some: { sourceId: id } } },
          data: { needsReview: true },
        });
      if (entity === 'pathology_content')
        await tx.pathology.update({
          where: { id: String(before.pathologyId) },
          data: { needsReview: true },
        });
      await this.record(
        {
          actor,
          action,
          entity,
          entityId: id,
          entityLabel: String(
            after.nameVi ?? after.title ?? after.promptVi ?? after.id,
          ),
          before,
          after,
        },
        tx,
      );
      return withRevision(entity, after);
    });
  }

  async restorePreview(id: string) {
    const entry = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!entry || !entry.before || !Object.hasOwn(EDIT_MODELS, entry.entity))
      throw new BadRequestException(
        'Thao tác này không có bản nội dung để khôi phục.',
      );
    const entity = entry.entity as EditableEntity;
    const model = this.prisma[EDIT_MODELS[entity]] as unknown as {
      findUnique: (args: object) => Promise<Record<string, unknown> | null>;
    };
    const current = await model.findUnique({ where: { id: entry.entityId } });
    if (!current) throw new NotFoundException('Bản ghi đã bị xoá.');
    const previous = entry.before as Record<string, unknown>;
    const fields = EDIT_FIELDS[entity].filter(
      (key) =>
        key !== 'needsReview' &&
        key !== 'localFile' &&
        Object.hasOwn(previous, key),
    );
    const data = Object.fromEntries(fields.map((key) => [key, previous[key]]));
    if (!fields.length)
      throw new BadRequestException('Không có nội dung để khôi phục.');
    return {
      entity,
      entityId: entry.entityId,
      data,
      current: Object.fromEntries(fields.map((key) => [key, current[key]])),
      expectedRevision: revisionOf(entity, current),
    };
  }

  async restore(actor: AuthUser, id: string, expectedRevision: string) {
    const preview = await this.restorePreview(id);
    return this.update(
      actor,
      preview.entity,
      preview.entityId,
      { ...preview.data, expectedRevision },
      'restore',
    );
  }

  /** Mutations and their audit entries commit or roll back together. */
  async record(
    input: {
      actor: AuthUser;
      action: string;
      entity: string;
      entityId: string;
      entityLabel?: string | null;
      before?: unknown;
      after?: unknown;
    },
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    await client.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        entityLabel: input.entityLabel ?? null,
        before: input.before ?? Prisma.JsonNull,
        after: input.after ?? Prisma.JsonNull,
      },
    });
  }

  async list(params: { entity?: string; actorEmail?: string; page?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const where: Prisma.AuditLogWhereInput = {
      entity: params.entity || undefined,
      actorEmail: params.actorEmail || undefined,
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE,
        take: PAGE,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize: PAGE };
  }
}
