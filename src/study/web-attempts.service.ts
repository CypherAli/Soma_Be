import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuthService } from '../auth/auth.service';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudyService, type GradedItem } from './study.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

type Question = { answer: string; scope: string; options?: Set<string> };
type Scene = {
  slug: string;
  visibleSystems: string[];
  hotspots: {
    key: string;
    label?: object;
    note?: object;
    latinName?: string;
  }[];
};
type BankQuestion = {
  id: string;
  region: string;
  answer: string;
  options: Record<string, string>;
};

/** Public submissions carry selections only. StudyService persists server-graded results. */
@Injectable()
export class WebAttemptsService {
  constructor(
    private readonly content: ContentService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly study: StudyService,
  ) {}

  async submit(dto: SubmitAttemptDto, token?: string) {
    const { user } = await this.auth.me(token);
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          source: dto.source,
          scope: dto.scope ?? 'all',
          mode: dto.mode ?? 'practice',
          seconds: dto.seconds ?? 0,
          answers: [...dto.answers]
            .sort((a, b) => a.questionId.localeCompare(b.questionId))
            .map((a) => ({
              questionId: a.questionId,
              answerId: a.answerId ?? null,
            })),
        }),
      )
      .digest('hex');
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
    if (
      new Set(dto.answers.map((a) => a.questionId)).size !== dto.answers.length
    )
      throw new BadRequestException(
        'Một câu chỉ được nộp một lần trong mỗi bài',
      );
    const questions = await this.questions(
      dto.source,
      user.id,
      dto.answers.map((a) => a.questionId),
    );
    const items: GradedItem[] = dto.answers.map((selection) => {
      const q = questions.get(selection.questionId);
      if (!q)
        throw new BadRequestException(
          'Câu hỏi không tồn tại hoặc không được phép sử dụng',
        );
      if (
        dto.scope &&
        dto.scope !== 'all' &&
        !q.scope.split('|').includes(dto.scope)
      )
        throw new BadRequestException('Câu hỏi không khớp phạm vi bài làm');
      if (selection.answerId && q.options && !q.options.has(selection.answerId))
        throw new BadRequestException('Phương án không thuộc câu hỏi');
      return {
        itemKey: `${dto.source}:${selection.questionId.split('#')[0]}`,
        source: dto.source,
        scope: dto.scope ?? 'all',
        correct: selection.answerId === q.answer,
      };
    });
    return this.study.recordAttempt(
      {
        clientRequestId: dto.clientRequestId,
        requestFingerprint: fingerprint,
        source: dto.source,
        scope: dto.scope,
        mode: dto.mode,
        seconds: dto.seconds,
        total: items.length,
        score: items.filter((i) => i.correct).length,
        items,
      },
      token,
    );
  }

  private async questions(source: string, userId: string, ids: string[]) {
    const result = new Map<string, Question>();
    if (source === 'personal') {
      const rows = await this.prisma.personalQuestion.findMany({
        where: { userId, approved: true, id: { in: ids } },
      });
      for (const q of rows)
        result.set(q.id, {
          scope: 'all',
          answer: `${q.id}:${q.answer}`,
          options: new Set(
            Object.keys(q.options as object).map(
              (letter) => `${q.id}:${letter}`,
            ),
          ),
        });
      return result;
    }
    if (source === 'atlas') {
      // Option identities depend on position in the actual submitted session.
      const byId = new Map(
        this.content.studySources.atlas.map((s) => [
          `atlas-${s.page}-${s.hotspotKey}`,
          s,
        ]),
      );
      ids.forEach((id, index) => {
        const shot = byId.get(id);
        if (shot)
          result.set(id, {
            scope: 'all',
            answer: `${shot.page}:${index}:ok`,
            options: new Set(
              ['ok', '0', '1', '2'].map(
                (option) => `${shot.page}:${index}:${option}`,
              ),
            ),
          });
      });
      return result;
    }
    const snapshot = await this.content.snapshot();
    for (const definition of this.content.definitions.values()) {
      const payload: unknown =
        snapshot.documents[definition.id] ?? definition.payload;
      if (
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        !('value' in payload)
      )
        continue;
      const value: unknown = payload.value;
      if (!value || typeof value !== 'object') continue;
      if (
        source === 'model' &&
        definition.source.startsWith('src/lib/scenes/')
      ) {
        const scenes = 'slug' in value ? [value] : Object.values(value);
        for (const candidate of scenes) {
          if (!candidate || typeof candidate !== 'object') continue;
          const scene = candidate as Scene;
          if (
            !scene.slug ||
            !Array.isArray(scene.hotspots) ||
            !Array.isArray(scene.visibleSystems)
          )
            continue;
          for (const spot of scene.hotspots) {
            if (!spot.label || !spot.note) continue;
            const factId = `${scene.slug}/${spot.key}`,
              scope = scene.visibleSystems.join('|');
            result.set(`${factId}#identify`, { scope, answer: factId });
            if (spot.latinName)
              result.set(`${factId}#latin`, { scope, answer: factId });
            if (scene.visibleSystems[0])
              result.set(`${factId}#system`, {
                scope,
                answer: scene.visibleSystems[0],
              });
          }
        }
      } else if (
        source === 'book' &&
        definition.source === '/kb/anatomy-mcq.json'
      ) {
        this.addBankQuestion(result, value as BankQuestion);
      } else if (source === 'school') {
        for (const school of this.content.studySources.schools) {
          if (definition.source === `/kb/schools/${school.file}`)
            this.addBankQuestion(result, value as BankQuestion, school.id);
        }
      }
    }
    return result;
  }

  private addBankQuestion(
    result: Map<string, Question>,
    q: BankQuestion,
    school?: string,
  ) {
    if (!q.id || !q.options || !Object.hasOwn(q.options, q.answer)) return;
    const id = school ? `${school}:${q.id}` : q.id;
    result.set(id, {
      scope: school ?? q.region,
      answer: `${id}:${q.answer}`,
      options: new Set(
        Object.keys(q.options).map((letter) => `${id}:${letter}`),
      ),
    });
  }
}
