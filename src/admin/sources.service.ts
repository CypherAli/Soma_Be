import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { withRevision } from './revisions';
import type { AuthUser } from '../auth/roles';
import { CreateSourceDto } from './dto/source.dto';

export const SOURCE_INDEX_MIME = 'application/vnd.soma.source-index+json';
import { validateSourceMetadata } from './source-metadata';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    actor: AuthUser,
    dto: CreateSourceDto,
    file?: Express.Multer.File,
  ) {
    validateSourceMetadata(dto);
    if (!file && !dto.url?.trim())
      throw new BadRequestException('Chọn PDF hoặc nhập liên kết tài liệu');
    if (dto.replaceId && !dto.expectedRevision)
      throw new BadRequestException('Thiếu phiên bản nguồn cần thay');
    const uuid = randomUUID(),
      id = 'source-' + uuid,
      localFile = file ? 'managed-' + uuid + '.pdf' : null;
    let pages: string[] = [];
    if (file) {
      if (
        file.size > 30 * 1024 * 1024 ||
        file.buffer.subarray(0, 5).toString() !== '%PDF-'
      )
        throw new BadRequestException('Chọn PDF hợp lệ, tối đa 30 MB');
      const parser = new PDFParse({ data: file.buffer });
      try {
        const result = await parser.getText();
        pages = result.pages.map((p) => p.text);
      } catch {
        throw new BadRequestException(
          'Không đọc được PDF. Kiểm tra tệp có bị hỏng hoặc đặt mật khẩu.',
        );
      } finally {
        await parser.destroy();
      }
      if (Buffer.byteLength(JSON.stringify(pages)) > 16 * 1024 * 1024)
        throw new BadRequestException(
          'Văn bản PDF vượt giới hạn lập chỉ mục 16 MB',
        );
    }
    const chunks = pages.flatMap((text, index) =>
      Array.from({ length: Math.ceil(text.length / 2200) }, (_, part) => ({
        id: id + ':' + index + ':' + part,
        sourceFile: localFile,
        page: index + 1,
        text: text.slice(part * 2200, (part + 1) * 2200),
      })),
    );
    const result = await this.audit.atomic(async (tx) => {
      let old: Awaited<ReturnType<typeof tx.medicalSource.findUnique>> = null;
      if (dto.replaceId) {
        old = await tx.medicalSource.findUnique({
          where: { id: dto.replaceId },
        });
        if (!old) throw new NotFoundException('Không có nguồn cần thay');
        this.audit.assertRevision('medical_source', old, dto.expectedRevision!);
      }
      if (file) {
        await tx.siteAsset.create({
          data: {
            id: uuid,
            filename: file.originalname,
            mime: 'application/pdf',
            bytes: file.size,
            data: Uint8Array.from(file.buffer),
            meshNames: [],
          },
        });
        const index = Buffer.from(JSON.stringify(chunks));
        await tx.siteAsset.create({
          data: {
            id: uuid + '-text',
            filename: localFile!,
            mime: SOURCE_INDEX_MIME,
            bytes: index.length,
            data: index,
            meshNames: [],
          },
        });
      }
      const source = await tx.medicalSource.create({
        data: {
          id,
          title: dto.title.trim(),
          publisher: dto.publisher.trim(),
          year: dto.year ?? null,
          url: dto.url?.trim() ?? '',
          localFile,
          status: file ? 'downloaded' : 'official-link',
          licenseNote: dto.licenseNote?.trim() ?? null,
        },
      });
      await this.audit.record(
        {
          actor,
          action: 'create',
          entity: 'medical_source',
          entityId: id,
          entityLabel: source.title,
          after: { ...source, replaces: old?.id ?? null },
        },
        tx,
      );
      if (old) {
        const archived = await tx.medicalSource.update({
          where: { id: old.id },
          data: { status: 'archived', checkedAt: new Date() },
        });
        await tx.pathology.updateMany({
          where: { citations: { some: { sourceId: old.id } } },
          data: { needsReview: true },
        });
        await this.audit.record(
          {
            actor,
            action: 'replace',
            entity: 'medical_source',
            entityId: old.id,
            entityLabel: old.title,
            before: old,
            after: { ...archived, replacedBy: id },
          },
          tx,
        );
      }
      return withRevision('medical_source', source);
    });
    return { ...result, pages: pages.length, indexed: chunks.length > 0 };
  }
}
