import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AuthService } from '../auth/auth.service';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudyService } from '../study/study.service';
import {
  MOBILE_MODELS,
  digest,
  questionsFromModels,
  type MobileModel,
} from './mobile.catalog';
import { SubmitMobileAttemptDto } from './mobile.dto';

type Localized = { vi?: string; en?: string };
type Scene = {
  slug: string;
  title: Localized;
  description: Localized;
  modelFile?: string;
  hotspots: {
    key: string;
    meshName: string;
    label?: Localized;
    latinName?: string;
    note?: Localized;
  }[];
};

@Injectable()
export class MobileService {
  readonly root: string;
  private readonly assetOrigins: Set<string>;
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
    const models: MobileModel[] = [];
    for (const target of MOBILE_MODELS) {
      const definition = [...this.content.definitions.values()].find(
        (d) =>
          d.source.startsWith('src/lib/scenes/') &&
          (d.payload.value as unknown as Scene)?.slug === target.id,
      );
      if (!definition) continue;
      const payload = (snapshot.documents[definition.id] ??
        definition.payload) as { value: Scene };
      const scene = payload.value;
      if (!scene?.title?.vi || !Array.isArray(scene.hotspots)) continue;
      models.push({
        id: target.id,
        title: scene.title.vi,
        english: scene.title.en ?? '',
        description: scene.description?.vi ?? '',
        system: target.system,
        modelPath: `/mobile/models/${target.id}/file`,
        viewerPath: `/mobile/viewer/${target.id}`,
        structures: scene.hotspots
          .filter((h) => h.key && h.meshName && h.label?.vi)
          .map((h) => ({
            id: h.key,
            meshName: h.meshName,
            label: h.label!.vi!,
            english: h.label?.en ?? '',
            latin: h.latinName ?? '',
            note: h.note?.vi ?? '',
          })),
        attribution:
          'Z-Anatomy / BodyParts3D · CC-BY-SA. Nội dung và thuật ngữ: thư viện Soma.',
      });
    }
    const questions = questionsFromModels(models);
    return {
      schemaVersion: 1,
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
    const value = MOBILE_MODELS.find((m) => m.id === id);
    if (!value)
      throw new NotFoundException('Mô hình không thuộc phiên bản app');
    return value;
  }

  async modelFile(id: string) {
    const target = this.target(id);
    const snapshot = await this.content.snapshot();
    const doc = [...this.content.definitions.values()].find(
      (d) =>
        d.source.startsWith('src/lib/scenes/') &&
        (d.payload.value as unknown as Scene)?.slug === id,
    );
    const scene = doc
      ? (
          (snapshot.documents[doc.id] ?? doc.payload) as unknown as {
            value: Scene;
          }
        ).value
      : null;
    const file = scene?.modelFile;
    let assetPath = file;
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
    if (file && file !== `/models/${target.file}`)
      throw new ServiceUnavailableException(
        'Model thay thế chưa nằm trong gói mobile. Cần chuẩn bị lại tài nguyên.',
      );
    return this.readAsset(`models/${target.file}`);
  }

  readAsset(key: string) {
    const file = join(this.root, key);
    if (!existsSync(file))
      throw new ServiceUnavailableException(
        'Thiếu tài nguyên app. Chạy npm run prepare:backend trong Soma_App.',
      );
    return readFileSync(file);
  }

  async viewer(id: string, dark = false) {
    this.target(id);
    const { models } = await this.bootstrap();
    const model = models.find((m) => m.id === id);
    if (!model) throw new NotFoundException('Chưa có nội dung mô hình');
    const config = JSON.stringify({ model, dark }).replace(/</g, '\\u003c');
    return this.readAsset('viewer/index.html')
      .toString('utf8')
      .replace('/*__SOMA_CONFIG__*/', `window.SOMA_VIEWER_CONFIG=${config};`);
  }
}
