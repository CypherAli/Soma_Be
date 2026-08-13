import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

type Chunk = { id: string; sourceFile: string; page: number; text: string };

@Injectable()
export class MedicalKnowledgeService {
  private chunks: Chunk[] = [];
  private loadedMtime = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  sources() {
    return this.prisma.medicalSource.findMany({
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
    });
  }

  private indexPath() {
    return (
      this.config.get<string>('MEDICAL_KB_INDEX') ||
      resolve(process.cwd(), '..', 'medical_kb', 'text', 'chunks.jsonl')
    );
  }

  private loadIndex() {
    const path = this.indexPath();
    const mtime = statSync(path).mtimeMs;
    if (this.chunks.length && mtime === this.loadedMtime) return;
    this.chunks = readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Chunk);
    this.loadedMtime = mtime;
  }

  async search(query: string, limit: number) {
    const terms =
      query
        .toLocaleLowerCase()
        .match(/[\p{L}\p{N}-]+/gu)
        ?.filter((term) => term.length > 2) ?? [];
    if (!terms.length) {
      throw new BadRequestException(
        'Truy vấn phải có ít nhất một từ dài hơn 2 ký tự',
      );
    }

    this.loadIndex();
    const sources = await this.prisma.medicalSource.findMany();
    const byFile = new Map(
      sources
        .filter((source) => source.localFile)
        .map((source) => [source.localFile!.split('/').pop()!, source]),
    );
    const results = this.chunks
      .map((chunk) => ({
        chunk,
        score: terms.reduce(
          (sum, term) =>
            sum + (chunk.text.toLocaleLowerCase().split(term).length - 1),
          0,
        ),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ chunk, score }) => {
        const source = byFile.get(chunk.sourceFile);
        return {
          chunkId: chunk.id,
          score,
          page: chunk.page,
          text: chunk.text,
          source: source ?? {
            title: chunk.sourceFile,
            localFile: chunk.sourceFile,
          },
          citation: `${source?.title ?? chunk.sourceFile}, p. ${chunk.page}`,
        };
      });

    return {
      query,
      count: results.length,
      results,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Kết quả cần được người có chuyên môn xác minh.',
    };
  }
}
