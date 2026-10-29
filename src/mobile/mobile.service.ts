import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { AuthService } from '../auth/auth.service';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudyService } from '../study/study.service';
import {
  digest,
  questionsFromModels,
  type MobileModel,
} from './mobile.catalog';
import { SubmitMobileAttemptDto } from './mobile.dto';
import {
  modelFromScene,
  type MobileScene,
  type PreparedManifest,
  type PreparedTarget,
} from './mobile.models';

type Snapshot = Awaited<ReturnType<ContentService['snapshot']>>;

@Injectable()
export class MobileService {
  readonly root: string;
  private readonly assetOrigins: Set<string>;
  private prepared?: { stamp: string; value: PreparedManifest };
  constructor(
    private readonly content: ContentService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly study: StudyService,
    config: ConfigService,
  ) {
    this.root = resolve(
      config.get<string>('MOBILE_ASSETS_DIR') ?? 'resources/mobile',
    );
    this.assetOrigins = new Set(
      ['API_URL', 'MOBILE_OAUTH_API_URL'].flatMap((key) => {
        try {
          const configured =
            config.get<string>(key) ||
            (key === 'API_URL' ? 'http://localhost:4000/api' : '');
          return [new URL(configured).origin];
        } catch {
          return [];
        }
      }),
    );
  }

  async bootstrap() {
    const snapshot = await this.content.snapshot();
    const manifest = this.manifest();
    const models: MobileModel[] = [];
    for (const target of manifest.models) {
      const scene = this.scene(target, snapshot);
      if (!scene?.title?.vi) continue;
      models.push(modelFromScene(target, scene, manifest.atlasKey));
    }
    const questions = questionsFromModels(models);
    return {
      schemaVersion: 2,
      version: digest({ models, questions }),
      models,
      questions,
    };
  }

  async due(token?: string) {
    const { user } = await this.auth.me(token);
    const { questions } = await this.bootstrap();
    const items = await this.prisma.reviewItem.findMany({
      where: {
        userId: user.id,
        dueAt: { lte: new Date() },
        itemKey: { in: questions.map((q) => q.itemKey) },
      },
      orderBy: [{ lapses: 'desc' }, { dueAt: 'asc' }],
      select: { itemKey: true },
      take: 200,
    });
    return { items };
  }

  async submit(dto: SubmitMobileAttemptDto, token?: string) {
    const { user } = await this.auth.me(token);
    const fingerprint = digest({
      scope: dto.scope,
      seconds: dto.seconds,
      answers: [...dto.answers].sort((a, b) =>
        a.itemKey.localeCompare(b.itemKey),
      ),
    });
    const existing = await this.prisma.quizAttempt.findUnique({
      where: {
        userId_clientRequestId: {
          userId: user.id,
          clientRequestId: dto.clientRequestId,
        },
      },
    });
    if (existing) {
      if (existing.requestFingerprint !== fingerprint)
        throw new ConflictException(
          'Mã lượt nộp đã được dùng cho bài làm khác',
        );
      return existing;
    }
    if (new Set(dto.answers.map((a) => a.itemKey)).size !== dto.answers.length)
      throw new BadRequestException(
        'Một câu chỉ được nộp một lần trong mỗi bài',
      );
    const { questions } = await this.bootstrap();
    const bank = new Map(questions.map((q) => [q.itemKey, q]));
    const items = dto.answers.map((answer) => {
      const q = bank.get(answer.itemKey);
      if (!q)
        throw new ConflictException(
          'Một câu đã được gỡ khỏi thư viện. Bài làm vẫn được giữ trên thiết bị.',
        );
      if (q.version !== answer.version)
        throw new ConflictException(
          'Nội dung câu hỏi đã cập nhật. Bài làm vẫn được giữ trên thiết bị.',
        );
      if (!q.options.some((o) => o.id === answer.answerId))
        throw new BadRequestException('Phương án không thuộc câu hỏi');
      if (dto.scope !== 'all' && q.scope !== dto.scope)
        throw new BadRequestException('Câu hỏi không khớp chủ đề');
      return {
        itemKey: q.itemKey,
        source: q.source,
        scope: q.scope,
        correct: answer.answerId === q.correctOptionId,
      };
    });
    return this.study.recordAttempt(
      {
        clientRequestId: dto.clientRequestId,
        requestFingerprint: fingerprint,
        source: 'model',
        scope: dto.scope,
        mode: 'practice',
        seconds: dto.seconds,
        total: items.length,
        score: items.filter((i) => i.correct).length,
        items,
      },
      token,
    );
  }

  private target(id: string) {
    const value = this.manifest().models.find((m) => m.id === id);
    if (!value)
      throw new NotFoundException('Mô hình không thuộc phiên bản app');
    return value;
  }

  private manifest(): PreparedManifest {
    const file = join(this.root, 'manifest.json');
    if (!existsSync(file))
      throw new ServiceUnavailableException(
        'Chạy npm run prepare:backend trong Soma_App để đồng bộ thư viện web.',
      );
    const metadata = statSync(file),
      stamp = `${metadata.mtimeMs}:${metadata.size}`;
    if (this.prepared?.stamp === stamp) return this.prepared.value;
    const value = JSON.parse(readFileSync(file, 'utf8')) as PreparedManifest;
    if (
      value.schemaVersion !== 2 ||
      !Array.isArray(value.models) ||
      !value.assets ||
      !value.parts
    )
      throw new ServiceUnavailableException(
        'Gói mô hình mobile cần được đồng bộ lại từ web.',
      );
    this.prepared = { stamp, value };
    return value;
  }

  private scene(target: PreparedTarget, snapshot: Snapshot): MobileScene {
    let sourceId = target.sourceId;
    const path: string[] = [];
    while (
      sourceId &&
      !this.content.definitions.has(sourceId) &&
      !Object.hasOwn(snapshot.documents, sourceId)
    ) {
      const slash = sourceId.lastIndexOf('/');
      if (slash <= sourceId.indexOf('#')) {
        sourceId = undefined;
        break;
      }
      path.unshift(sourceId.slice(slash + 1));
      sourceId = sourceId.slice(0, slash);
    }
    const definition = sourceId
      ? this.content.definitions.get(sourceId)
      : undefined;
    const payload = sourceId
      ? (snapshot.documents[sourceId] ?? definition?.payload)
      : undefined;
    let value: unknown = (payload as { value?: unknown } | undefined)?.value;
    for (const key of path)
      value =
        value && typeof value === 'object' && Object.hasOwn(value, key)
          ? (value as Record<string, unknown>)[key]
          : undefined;
    const scene = (value as MobileScene | undefined) ?? target.definition;
    // The web registry enriches skull/tooth scenes with shared surface landmarks.
    // Preserve that enrichment when the CMS source document has no landmarks field.
    return {
      ...scene,
      ...(scene.groups
        ? {
            groups: scene.groups.map((group) => ({
              ...group,
              landmarks:
                group.landmarks ??
                target.definition.groups?.find(
                  (original) => original.key === group.key,
                )?.landmarks,
            })),
          }
        : {}),
    };
  }

  asset(key: string) {
    const asset = Object.hasOwn(this.manifest().assets, key)
      ? this.manifest().assets[key]
      : undefined;
    if (!asset || !/^assets\/[a-f0-9]{24}\.[a-z0-9]+$/.test(asset.file))
      throw new NotFoundException('Tài nguyên không thuộc thư viện mobile');
    return { data: this.readAsset(asset.file), type: asset.type };
  }

  async modelFile(id: string) {
    const target = this.target(id);
    const snapshot = await this.content.snapshot();
    const scene = this.scene(target, snapshot);
    const file = scene.replacement?.modelFile || scene.modelFile;
    if (!file)
      throw new NotFoundException(
        'Mô hình này dùng dữ liệu Atlas, không có tệp GLB riêng.',
      );
    let assetPath: string | undefined = file;
    if (file && /^https?:\/\//.test(file)) {
      const url = new URL(file);
      assetPath =
        this.assetOrigins.has(url.origin) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
          ? url.pathname
          : undefined;
    }
    const assetId = assetPath?.match(
      /^\/api\/content\/assets\/([a-f0-9-]+)$/,
    )?.[1];
    if (assetId) {
      const asset = await this.content.asset(assetId);
      if (asset.mime !== 'model/gltf-binary')
        throw new ServiceUnavailableException(
          'Tài nguyên mô hình không phải GLB',
        );
      return Buffer.from(asset.data);
    }
    const preparedAsset = Object.entries(this.manifest().assets).find(
      ([, asset]) =>
        asset.source === file && asset.type === 'model/gltf-binary',
    );
    if (!preparedAsset)
      throw new ServiceUnavailableException(
        'Model thay thế chưa nằm trong gói mobile. Cần chuẩn bị lại tài nguyên.',
      );
    return this.asset(preparedAsset[0]).data;
  }

  readAsset(key: string) {
    const file = resolve(this.root, key);
    if (!file.startsWith(this.root + sep))
      throw new NotFoundException('Tài nguyên không tồn tại');
    if (!existsSync(file))
      throw new ServiceUnavailableException(
        'Thiếu tài nguyên app. Chạy npm run prepare:backend trong Soma_App.',
      );
    return readFileSync(file);
  }

  async viewer(id: string, dark = false) {
    const target = this.target(id);
    const snapshot = await this.content.snapshot();
    const manifest = this.manifest(),
      scene = this.scene(target, snapshot);
    const model = modelFromScene(target, scene, manifest.atlasKey);
    const ids = new Set(scene.groups?.flatMap((group) => group.parts) ?? []);
    const parts = Object.fromEntries(
      [...ids].map((partId) => {
        const part = manifest.parts[partId];
        if (!part)
          throw new ServiceUnavailableException(
            'Dữ liệu Atlas mới cần đồng bộ gói mobile.',
          );
        const published = snapshot.documents[
          `learning:${partId}`
        ] as unknown as
          | {
              value?: {
                name?: { vi?: string };
                latin?: string;
                note?: { vi?: string };
                sources?: typeof part.sources;
              };
            }
          | undefined;
        const learning = published?.value;
        return [
          partId,
          {
            ...part,
            ...(learning?.name?.vi ? { label: learning.name.vi } : {}),
            ...(learning?.latin ? { latin: learning.latin } : {}),
            ...(learning?.note?.vi ? { note: learning.note.vi } : {}),
            ...(learning?.sources ? { sources: learning.sources } : {}),
          },
        ];
      }),
    );
    const systemsPayload = snapshot.documents[
      'data:src/lib/humanAtlas/anatomy.ts#SYSTEMS'
    ] as unknown as { value?: PreparedManifest['systems'] } | undefined;
    const config = JSON.stringify({
      model,
      dark,
      scene,
      parts,
      systems: systemsPayload?.value ?? manifest.systems,
      atlasPath: `../assets/${manifest.atlasKey}`,
    }).replace(/</g, '\\u003c');
    return this.readAsset('viewer/index.html')
      .toString('utf8')
      .replace('/*__SOMA_CONFIG__*/', `window.SOMA_VIEWER_CONFIG=${config};`);
  }
}
