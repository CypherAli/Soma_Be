import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AuthService } from '../auth/auth.service';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudyService } from '../study/study.service';
import { digest } from './mobile.catalog';
import { MobileChatDto, SourceAttemptDto } from './mobile-learning.dto';

type SourceQuestion = {
  id: string;
  number: number;
  stem: string;
  context?: string;
  options: { id: string; text: string }[];
  answers: string[];
  explanation: string;
  images: string[];
  explanationImages: string[];
  sourcePage: number;
  gradable: boolean;
};
type Entry = {
  id: string;
  title: string;
  file: string;
  group: string;
  count: number;
  gradableCount: number;
  sourceHash: string;
  cover?: string;
  sourceNote?: string;
};
const sourceLabel = (value: string) =>
  value
    .replace(/\bdr[.\s]*l[âa]m\b/giu, '')
    .replace(/\s+\.(pdf|docx)\b/gi, '.$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
const catalogId = 'data:src/lib/anatomy/drLamBank.ts#drLamCatalog';

@Injectable()
export class MobileLearningService {
  constructor(
    private readonly auth: AuthService,
    private readonly content: ContentService,
    private readonly prisma: PrismaService,
    private readonly study: StudyService,
    private readonly config: ConfigService,
  ) {}

  private async published() {
    const snapshot = await this.content.snapshot();
    const value = (id: string) => {
      const payload =
        snapshot.documents[id] ?? this.content.definitions.get(id)?.payload;
      return (payload as { value?: unknown } | undefined)?.value;
    };
    const catalog = value(catalogId) as
      { exams: Entry[]; title: string } | undefined;
    if (!catalog?.exams)
      throw new ServiceUnavailableException('Chưa chuẩn bị bộ đề nguồn');
    return { catalog, value };
  }
  async sources(token?: string) {
    const { user } = await this.auth.me(token);
    const { catalog } = await this.published();
    const docs = await this.prisma.personalDoc.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        status: true,
        _count: { select: { questions: { where: { approved: true } } } },
      },
    });
    const due = await this.prisma.reviewItem.findMany({
      where: {
        userId: user.id,
        source: { in: ['dr-lam', 'personal'] },
        dueAt: { lte: new Date() },
      },
      select: { scope: true },
    });
    const dueCount = (scope: string) =>
      due.filter((i) => i.scope === scope).length;
    return {
      title: catalog.title,
      exams: catalog.exams.map((e) => ({
        ...e,
        title: sourceLabel(e.title),
        kind: 'source',
        dueCount: dueCount(e.id),
      })),
      personal: docs.map((d) => ({
        id: `personal-${d.id}`,
        title: sourceLabel(d.filename),
        count: d._count.questions,
        gradableCount: d._count.questions,
        group: 'PDF & Word của tôi',
        kind: 'personal',
        status: d.status,
        dueCount: dueCount(`personal-${d.id}`),
      })),
    };
  }
  async bank(id: string, token?: string) {
    const { user } = await this.auth.me(token);
    const reviews = await this.prisma.reviewItem.findMany({
      where: {
        userId: user.id,
        scope: id,
        dueAt: { lte: new Date() },
        source: { in: ['dr-lam', 'personal'] },
      },
      select: { itemKey: true },
    });
    const dueIds = reviews.map((r) =>
      r.itemKey.slice(r.itemKey.indexOf(':') + 1),
    );
    if (id.startsWith('personal-')) {
      const doc = await this.prisma.personalDoc.findFirst({
        where: { id: id.slice(9), userId: user.id },
        include: {
          questions: {
            where: { approved: true },
            orderBy: { sequence: 'asc' },
          },
        },
      });
      if (!doc)
        throw new NotFoundException('Không có tài liệu trong tài khoản này');
      const questions: SourceQuestion[] = doc.questions.map((q, i) => ({
        id: q.id,
        number: i + 1,
        stem: q.stem,
        options: Object.entries(q.options as Record<string, string>).map(
          ([id, text]) => ({ id, text }),
        ),
        answers: q.answers.length ? q.answers : q.answer ? [q.answer] : [],
        explanation: q.explanation ?? '',
        context: q.context ?? undefined,
        images: q.images,
        explanationImages: q.explanationImages,
        sourcePage: q.page ?? 0,
        gradable: q.answers.length > 0 || !!q.answer,
      }));
      return {
        id,
        title: sourceLabel(doc.filename),
        sourceFile: sourceLabel(doc.filename),
        dueIds,
        sourceNote: 'Chỉ gồm câu đã duyệt trong tài khoản này.',
        version: digest(questions),
        questions,
      };
    }
    const { catalog, value } = await this.published();
    const entry = catalog.exams.find((e) => e.id === id);
    if (!entry || !/^[a-z0-9-]+\.json$/.test(entry.file))
      throw new NotFoundException('Đề không tồn tại');
    const path = `/kb/dr-lam/${entry.file}`;
    const questions = [...this.content.definitions.values()]
      .filter((d) => d.source === path)
      .map((d) => value(d.id) as SourceQuestion)
      .filter((q) => q && typeof q.stem === 'string')
      .sort((a, b) => a.number - b.number);
    return {
      id,
      title: sourceLabel(entry.title),
      sourceFile: sourceLabel(entry.title),
      dueIds,
      sourceNote: entry.sourceNote,
      version: digest(questions),
      questions,
    };
  }
  image(key: string) {
    if (!/^[a-f0-9]{20}\.webp$/.test(key)) throw new NotFoundException();
    try {
      return readFileSync(
        join(
          resolve(
            this.config.get<string>('MOBILE_ASSETS_DIR') ?? 'resources/mobile',
          ),
          'source-images',
          key,
        ),
      );
    } catch {
      throw new NotFoundException();
    }
  }
  async submit(dto: SourceAttemptDto, token?: string) {
    const { user } = await this.auth.me(token);
    const fingerprint = digest(dto);
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
        throw new ConflictException('Mã lượt nộp đã dùng cho bài khác');
      return existing;
    }
    const bank = await this.bank(dto.bankId, token);
    if (bank.version !== dto.version)
      throw new ConflictException(
        'Đề đã cập nhật. Bài làm vẫn được giữ trên thiết bị.',
      );
    if (new Set(dto.answers.map((a) => a.id)).size !== dto.answers.length)
      throw new BadRequestException('Trùng câu hỏi');
    const personal = dto.bankId.startsWith('personal-');
    const source = personal ? 'personal' : 'dr-lam';
    const graded = dto.answers.flatMap((a) => {
      const q = bank.questions.find((q) => q.id === a.id);
      if (
        !q ||
        a.answers.some((id) => !q.options.some((o) => o.id === id)) ||
        new Set(a.answers).size !== a.answers.length
      )
        throw new BadRequestException('Câu hoặc phương án không hợp lệ');
      if (!q.gradable || !q.answers.length) return [];
      return [
        {
          source,
          itemKey: `${source}:${q.id}`,
          scope: dto.bankId,
          correct:
            [...q.answers].sort().join('|') === [...a.answers].sort().join('|'),
        },
      ];
    });
    if (!graded.length)
      throw new BadRequestException('Đề này chưa có câu đủ đáp án để chấm');
    return this.study.recordAttempt(
      {
        source,
        scope: dto.bankId,
        mode: dto.mode,
        clientRequestId: dto.clientRequestId,
        requestFingerprint: fingerprint,
        seconds: dto.seconds,
        total: graded.length,
        score: graded.filter((i) => i.correct).length,
        items: graded,
      },
      token,
    );
  }
  async chat(dto: MobileChatDto, token?: string) {
    await this.auth.me(token);
    // Fixed, server-configured upstream; clients cannot select a URL.
    const base =
      this.config.get<string>('MOBILE_WEB_URL') || 'http://127.0.0.1:3000';
    try {
      const response = await fetch(new URL('/api/assistant', base), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
        signal: AbortSignal.timeout(55000),
        redirect: 'error',
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw new HttpException(body, response.status);
      return body;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'Trợ lý đang mất kết nối. Bạn có thể thử lại sau.',
      );
    }
  }
}
