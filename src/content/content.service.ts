import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateBytes } from 'gltf-validator';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/roles';
import type {
  ContentVersionDto,
  RestoreContentDto,
  SaveSiteContentDto,
} from './content.dto';
import {
  type ContentDefinition,
  glbMeshNames,
  validateContent,
} from './content.validation';
import {
  contentSearchEntry,
  contentSearchScore,
  matchesContentKind,
  type ContentSearchEntry,
} from './content.search';

@Injectable()
export class ContentService {
  studySources!: {
    atlas: { page: number; hotspotKey: string }[];
    schools: { id: string; file: string }[];
  };
  definitions!: Map<string, ContentDefinition>;
  private sourceMeshes!: Record<string, string[]>;
  private atlasParts!: Set<string>;
  contractHash!: string;
  private readonly catalogPath: string;
  private catalogStamp = '';
  private readonly activeAtlasBySlug = new Map<string, string>();
  private readonly routeAliasNames = new Map<string, string[]>();
  private readonly searchIndex = new Map<string, ContentSearchEntry>();
  private snapshotCache?: {
    expires: number;
    value: Awaited<ReturnType<ContentService['readSnapshot']>>;
  };

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.catalogPath = resolve(
      config.get<string>('CMS_CATALOG_PATH') ?? 'resources/cms/catalog.json',
    );
    this.refreshCatalog();
  }

  /** A source sync must replace both the contract and indexes without a restart. */
  private refreshCatalog() {
    const metadata = statSync(this.catalogPath);
    const stamp = `${metadata.mtimeMs}:${metadata.size}`;
    if (stamp === this.catalogStamp) return;
    const catalog = JSON.parse(readFileSync(this.catalogPath, 'utf8')) as {
      documents: ContentDefinition[];
      meshes: Record<string, string[]>;
      atlasParts: string[];
      contractHash?: string;
      studySources?: ContentService['studySources'];
    };
    this.definitions = new Map(catalog.documents.map((doc) => [doc.id, doc]));
    this.studySources = catalog.studySources ?? { atlas: [], schools: [] };
    this.sourceMeshes = catalog.meshes;
    this.atlasParts = new Set(catalog.atlasParts);
    this.contractHash = catalog.contractHash ?? '';
    this.searchIndex.clear();
    this.activeAtlasBySlug.clear();
    this.routeAliasNames.clear();
    for (const doc of catalog.documents) {
      const entry = contentSearchEntry(doc);
      this.searchIndex.set(doc.id, entry);
      if (entry.kind === 'atlas-scene' && entry.identifier)
        this.activeAtlasBySlug.set(entry.identifier, doc.id);
    }
    // Mirrors the public atlasSceneAliases route in humanAtlas/scenes/index.ts.
    const aliases: Record<string, string> = {
      'tieu-nao-day-du': 'hoi-vo-dai-nao',
      'co-quan-sinh-duc-nam': 'he-sinh-san-nam',
    };
    for (const [alias, slug] of Object.entries(aliases)) {
      const target = this.activeAtlasBySlug.get(slug);
      if (target) {
        this.activeAtlasBySlug.set(alias, target);
        const legacy = [...this.searchIndex.values()].find(
          (entry) => entry.identifier === alias && entry.kind === 'glb',
        );
        this.routeAliasNames.set(target, [...(legacy?.names ?? []), alias]);
      }
    }
    this.catalogStamp = stamp;
    this.snapshotCache = undefined;
  }

  /** The public route renders an atlas scene before a legacy GLB with the same slug. */
  private effectiveId(id: string) {
    const doc = this.definitions.get(id);
    if (!doc || !['glb', 'atlas-scene'].includes(contentSearchEntry(doc).kind))
      return id;
    const slug = contentSearchEntry(doc).identifier;
    return this.activeAtlasBySlug.get(slug) ?? id;
  }
  private definition(id: string) {
    this.refreshCatalog();
    const definition = this.definitions.get(id);
    if (!definition) throw new NotFoundException('Không tìm thấy nội dung');
    return definition;
  }

  async list(category?: string, q = '', page = 1, kind = '', scope = 'title') {
    this.refreshCatalog();
    const order: Record<string, number> = {
      interface: 0,
      models: 1,
      explanations: 2,
      quizzes: 3,
    };
    const candidates = [...this.definitions.values()].filter(
      (doc) => !category || doc.category === category,
    );
    // Saved names must be searchable immediately, including after a server restart.
    const states = await this.prisma.siteContent.findMany({
      where: { id: { in: candidates.map((doc) => doc.id) } },
      select: {
        id: true,
        version: true,
        publishedAt: true,
        updatedAt: true,
        draft: true,
        published: true,
      },
    });
    const byId = new Map(states.map((state) => [state.id, state]));
    const definitions = candidates
      .map((doc) => {
        const state = byId.get(doc.id);
        const entry = state
          ? contentSearchEntry(doc, state.draft as ContentDefinition['payload'])
          : this.searchIndex.get(doc.id)!;
        const searchable = {
          ...entry,
          names: [...entry.names, ...(this.routeAliasNames.get(doc.id) ?? [])],
        };
        return {
          doc,
          entry: searchable,
          score: contentSearchScore(searchable, q, scope),
        };
      })
      .filter(
        ({ doc, entry, score }) =>
          score > 0 &&
          matchesContentKind(entry, kind) &&
          (kind !== 'scenes' || this.effectiveId(doc.id) === doc.id),
      )
      .sort(
        (a, b) =>
          b.score - a.score ||
          order[a.doc.category] - order[b.doc.category] ||
          Number(a.doc.id.startsWith('copy:')) -
            Number(b.doc.id.startsWith('copy:')) ||
          a.entry.title.localeCompare(b.entry.title, 'vi') ||
          a.doc.id.localeCompare(b.doc.id),
      );
    const current = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const selected = definitions.slice((current - 1) * 30, current * 30);
    return {
      items: selected.map(({ doc: definition, entry }) => {
        const { id, source, category } = definition;
        const title = entry.title;
        const doc = { id, title, source, category };
        const state = byId.get(doc.id);
        return {
          ...doc,
          effectiveId: this.effectiveId(id),
          kind: entry.kind,
          identifier: entry.identifier,
          version: state?.version ?? 0,
          publishedAt: state?.publishedAt ?? null,
          updatedAt: state?.updatedAt ?? null,
          pending:
            !!state &&
            JSON.stringify(state.draft) !== JSON.stringify(state.published),
        };
      }),
      total: definitions.length,
      page: current,
      pageSize: 30,
      categories: [
        ...new Set([...this.definitions.values()].map((doc) => doc.category)),
      ],
    };
  }

  async detail(id: string) {
    this.refreshCatalog();
    const requestedId = id;
    id = this.effectiveId(id);
    const definition = this.definition(id);
    const state = await this.prisma.siteContent.findUnique({ where: { id } });
    const { title, kind, identifier } = contentSearchEntry(
      definition,
      (state?.draft as ContentDefinition['payload']) ?? definition.payload,
    );
    return {
      ...definition,
      redirectedFrom: requestedId !== id ? requestedId : null,
      title,
      kind,
      identifier,
      draft: state?.draft ?? definition.payload,
      published: state?.published ?? definition.payload,
      version: state?.version ?? 0,
      publishedAt: state?.publishedAt ?? null,
      updatedAt: state?.updatedAt ?? null,
    };
  }

  async snapshot() {
    this.refreshCatalog();
    if (this.snapshotCache && this.snapshotCache.expires > Date.now())
      return structuredClone(this.snapshotCache.value);
    const value = await this.readSnapshot();
    this.snapshotCache = { expires: Date.now() + 3000, value };
    return structuredClone(value);
  }

  private async readSnapshot() {
    const rows = await this.prisma.siteContent.findMany({
      where: { publishedAt: { not: null } },
      select: { id: true, published: true },
      orderBy: { id: 'asc' },
    });
    const valid = rows.filter((row) => this.definitions.has(row.id));
    return {
      schemaVersion: 2,
      contractHash: this.contractHash,
      documents: Object.fromEntries(
        valid.map((row) => [row.id, row.published]),
      ),
      rules: valid
        .filter((row) => row.id.startsWith('copy:'))
        .map((row) => {
          const before = this.definition(row.id).payload;
          const after = row.published as Record<string, unknown>;
          return {
            id: row.id,
            before: before.value ?? before.texts,
            after: after.value ?? after.texts,
          };
        }),
    };
  }

  private async validate(id: string, payload: unknown) {
    const definition = this.definition(id);
    validateContent(payload, definition.payload);
    if (Buffer.byteLength(JSON.stringify(payload)) > 8 * 1024 * 1024)
      throw new BadRequestException('Nội dung vượt quá 8 MB');
    const visit = async (node: unknown): Promise<void> => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (const item of node) await visit(item);
        return;
      }
      const record = node as Record<string, unknown>;
      if (Array.isArray(record.groups)) {
        const groups = record.groups as { key?: string; parts?: string[] }[];
        for (const group of groups)
          for (const part of group.parts ?? [])
            if (!this.atlasParts.has(part))
              throw new BadRequestException(
                `Mảnh atlas không tồn tại: ${part}`,
              );
        const keys = new Set(groups.map((group) => group.key));
        const original = definition.payload.value;
        const source =
          original &&
          !Array.isArray(original) &&
          typeof original === 'object' &&
          original.slug === record.slug
            ? original
            : undefined;
        const sourceGroups = new Set(
          ((source?.groups ?? []) as { key?: string }[]).map(
            (group) => group.key,
          ),
        );
        for (const field of ['frameGroups', 'fadedGroups']) {
          // Keep inert references already shipped in source, but never create a new orphan.
          const existingOrphans = new Set(
            ((source?.[field] ?? []) as string[]).filter(
              (key) => !sourceGroups.has(key),
            ),
          );
          if (
            Array.isArray(record[field]) &&
            (record[field] as string[]).some(
              (key) => !keys.has(key) && !existingOrphans.has(key),
            )
          )
            throw new BadRequestException(`${field}: nhóm không tồn tại`);
        }
        for (const layer of (record.layers ?? []) as { groups?: string[] }[])
          if (layer.groups?.some((key) => !keys.has(key)))
            throw new BadRequestException('Lớp chứa nhóm không tồn tại');
      }
      if (
        typeof record.modelFile === 'string' &&
        record.modelFile &&
        Array.isArray(record.hotspots)
      ) {
        let names: string[] | undefined = this.sourceMeshes[record.modelFile];
        const match = record.modelFile.match(
          /\/content\/assets\/([a-f0-9-]+)$/,
        );
        if (match)
          names = (
            await this.prisma.siteAsset.findUnique({
              where: { id: match[1] },
              select: { meshNames: true },
            })
          )?.meshNames as string[] | undefined;
        if (!names)
          throw new BadRequestException(
            'Mô hình chưa có trong thư viện đã kiểm tra',
          );
        const normalized = new Set(
          names.flatMap((name) => [
            name,
            name.replace(/\s/g, '_').replace(/[[\].:/]/g, ''),
          ]),
        );
        for (const spot of record.hotspots as { meshName: string }[])
          if (!normalized.has(spot.meshName))
            throw new BadRequestException(
              `Mô hình không chứa mesh: ${spot.meshName}`,
            );
        for (const spot of record.hotspots as { label?: { vi?: string } }[])
          if (spot.label && !spot.label.vi?.trim())
            throw new BadRequestException('Mỗi chú giải cần tên tiếng Việt');
      }
      for (const [key, item] of Object.entries(record)) {
        if (
          key === 'answer' &&
          typeof item === 'string' &&
          record.options &&
          !Object.hasOwn(record.options, item)
        )
          throw new BadRequestException('Đáp án phải thuộc các phương án');
        await visit(item);
      }
    };
    await visit(payload);
  }

  private async write(
    actor: AuthUser,
    id: string,
    version: number,
    payload: unknown,
    action: string,
    publish = false,
  ) {
    this.refreshCatalog();
    if (this.effectiveId(id) !== id)
      throw new ConflictException(
        'Mô hình này có bản atlas đang được website dùng. Mở lại để sửa đúng bản đang hiển thị.',
      );
    await this.validate(id, payload);
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const before = await tx.siteContent.findUnique({ where: { id } });
        if ((before?.version ?? 0) !== version)
          throw new ConflictException(
            'Nội dung vừa được người khác sửa. Tải lại để đối chiếu trước khi lưu.',
          );
        const next = version + 1;
        const data = payload as Prisma.InputJsonObject;
        if (before) {
          const updated = await tx.siteContent.updateMany({
            where: { id, version },
            data: {
              draft: data,
              version: next,
              ...(publish ? { published: data, publishedAt: new Date() } : {}),
            },
          });
          if (updated.count !== 1)
            throw new ConflictException('Nội dung vừa thay đổi. Hãy tải lại.');
        } else {
          await tx.siteContent.create({
            data: {
              id,
              draft: data,
              version: next,
              ...(publish ? { published: data, publishedAt: new Date() } : {}),
            },
          });
          await tx.siteContentRevision.create({
            data: {
              contentId: id,
              version: 0,
              payload: this.definition(id).payload,
              action: 'source',
              actorEmail: actor.email,
            },
          });
        }
        await tx.siteContentRevision.create({
          data: {
            contentId: id,
            version: next,
            payload: data,
            action,
            actorEmail: actor.email,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            actorEmail: actor.email,
            action,
            entity: 'site_content',
            entityId: id,
            entityLabel: this.definition(id).title,
            before:
              before?.draft ??
              (this.definition(id).payload as Prisma.InputJsonObject),
            after: data,
          },
        });
        return { version: next };
      });
      this.snapshotCache = undefined;
      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Nội dung vừa thay đổi. Hãy tải lại.');
      throw error;
    }
  }

  save(actor: AuthUser, id: string, dto: SaveSiteContentDto) {
    return this.write(actor, id, dto.version, dto.payload, 'draft');
  }
  async publish(actor: AuthUser, id: string, dto: ContentVersionDto) {
    const state = await this.detail(id);
    if (state.version !== dto.version)
      throw new ConflictException('Nội dung vừa thay đổi. Hãy tải lại.');
    return this.write(actor, id, dto.version, state.draft, 'publish', true);
  }
  async restore(actor: AuthUser, id: string, dto: RestoreContentDto) {
    const revision = await this.prisma.siteContentRevision.findFirst({
      where: { id: dto.revisionId, contentId: id },
    });
    if (!revision) throw new NotFoundException('Không tìm thấy phiên bản');
    return this.write(actor, id, dto.version, revision.payload, 'restore');
  }
  history(id: string, page = 1) {
    this.definition(id);
    return this.prisma.siteContentRevision.findMany({
      where: { contentId: id },
      orderBy: { version: 'desc' },
      take: 40,
      skip: (Math.max(1, page) - 1) * 40,
      select: {
        id: true,
        version: true,
        action: true,
        actorEmail: true,
        createdAt: true,
      },
    });
  }

  async revision(id: string, revisionId: string) {
    this.definition(id);
    const revision = await this.prisma.siteContentRevision.findFirst({
      where: { contentId: id, id: revisionId },
    });
    if (!revision) throw new NotFoundException('Không tìm thấy phiên bản');
    return revision;
  }
  async preview(id: string, dto: ContentVersionDto) {
    const detail = await this.detail(id);
    if (detail.version !== dto.version)
      throw new ConflictException('Hãy tải lại nội dung trước khi xem trước');
    const token = randomBytes(32).toString('hex');
    const snapshot = await this.snapshot();
    snapshot.documents[id] = detail.draft;
    const original = this.definition(id).payload;
    const draft = detail.draft as Record<string, unknown>;
    snapshot.rules = snapshot.rules.filter((rule) => rule.id !== id);
    if (id.startsWith('copy:'))
      snapshot.rules.push({
        id,
        before: original.value ?? original.texts,
        after: draft.value ?? draft.texts,
      });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.siteContentPreview.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    await this.prisma.siteContentPreview.create({
      data: {
        tokenHash: createHash('sha256').update(token).digest('hex'),
        payload: snapshot as Prisma.InputJsonObject,
        expiresAt,
      },
    });
    return { token, expiresAt };
  }
  async previewSnapshot(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new NotFoundException('Liên kết xem trước không hợp lệ');
    const preview = await this.prisma.siteContentPreview.findUnique({
      where: { tokenHash: createHash('sha256').update(token).digest('hex') },
    });
    if (!preview || preview.expiresAt < new Date())
      throw new NotFoundException('Liên kết xem trước đã hết hạn');
    return preview.payload;
  }
  async upload(actor: AuthUser, file?: Express.Multer.File) {
    if (!file?.buffer) throw new BadRequestException('Chọn tệp ảnh hoặc GLB');
    const data = file.buffer;
    const glb = data.toString('ascii', 0, 4) === 'glTF';
    const png = data
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
    const webp =
      data.toString('ascii', 0, 4) === 'RIFF' &&
      data.toString('ascii', 8, 12) === 'WEBP';
    if (!glb && !png && !jpeg && !webp)
      throw new BadRequestException('Chỉ nhận GLB 2.0, PNG, JPEG và WebP');
    if (!glb && file.size > 10 * 1024 * 1024)
      throw new BadRequestException('Ảnh tối đa 10 MB');
    const meshNames = glb ? glbMeshNames(data) : [];
    if (glb) {
      const report = await validateBytes(new Uint8Array(data), {
        maxIssues: 20,
        externalResourceFunction: () =>
          Promise.reject(new Error('External resources are disabled')),
      });
      if (report.issues.numErrors > 0)
        throw new BadRequestException(
          `GLB không dựng được: ${report.issues.messages
            .filter((issue) => issue.severity === 0)
            .slice(0, 3)
            .map((issue) => `${issue.code} ${issue.pointer ?? ''}`)
            .join('; ')}`,
        );
    }
    const id = randomUUID();
    const mime = glb
      ? 'model/gltf-binary'
      : png
        ? 'image/png'
        : jpeg
          ? 'image/jpeg'
          : 'image/webp';
    const asset = await this.prisma.$transaction(async (tx) => {
      const created = await tx.siteAsset.create({
        data: {
          id,
          filename: file.originalname.slice(0, 180),
          mime,
          bytes: file.size,
          data: new Uint8Array(data),
          meshNames,
        },
        select: {
          id: true,
          filename: true,
          mime: true,
          bytes: true,
          meshNames: true,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          action: 'upload',
          entity: 'site_asset',
          entityId: id,
          entityLabel: created.filename,
        },
      });
      return created;
    });
    return { ...asset, url: `/api/content/assets/${id}` };
  }
  async assets(q = '', page = 1, kind = '') {
    const current = Math.max(1, Math.floor(page));
    const where: Prisma.SiteAssetWhereInput = {
      NOT: {
        mime: {
          in: ['application/pdf', 'application/vnd.soma.source-index+json'],
        },
      },
      ...(q.trim()
        ? { filename: { contains: q.trim(), mode: 'insensitive' } }
        : {}),
      ...(kind === 'model'
        ? { mime: 'model/gltf-binary' }
        : kind === 'image'
          ? { mime: { startsWith: 'image/' } }
          : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.siteAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (current - 1) * 24,
        take: 24,
        select: {
          id: true,
          filename: true,
          mime: true,
          bytes: true,
          meshNames: true,
          createdAt: true,
        },
      }),
      this.prisma.siteAsset.count({ where }),
    ]);
    return { items, total, page: current, pageSize: 24 };
  }
  async models() {
    this.refreshCatalog();
    const uploaded = await this.prisma.siteAsset.findMany({
      where: { mime: 'model/gltf-binary' },
      select: { id: true, meshNames: true },
      orderBy: { createdAt: 'desc' },
    });
    return [
      ...Object.entries(this.sourceMeshes).map(([url, meshNames]) => ({
        url,
        meshNames,
      })),
      ...uploaded.map((asset) => ({
        url: `/api/content/assets/${asset.id}`,
        meshNames: asset.meshNames,
      })),
    ];
  }
  async asset(id: string) {
    const asset = await this.prisma.siteAsset.findUnique({ where: { id } });
    if (
      !asset ||
      !['model/gltf-binary', 'image/png', 'image/jpeg', 'image/webp'].includes(
        asset.mime,
      )
    )
      throw new NotFoundException('Không tìm thấy tệp');
    return asset;
  }
}
