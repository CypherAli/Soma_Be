import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  documentExcerpt,
  rankDocumentChunks,
  textbookChunks,
} from './retrieval';

type Chunk = {
  id: string;
  sourceFile: string;
  page: number;
  printedPage?: number;
  text: string;
};

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
      where: { status: { not: 'archived' } },
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
    });
  }

  private indexPath() {
    return (
      this.config.get<string>('MEDICAL_KB_INDEX') ||
      resolve(
        this.config.get<string>('MEDICAL_KB_ROOT') ||
          resolve(process.cwd(), 'resources', 'medical_kb'),
        'text',
        'chunks.jsonl',
      )
    );
  }

  private loadIndex() {
    const path = this.indexPath();
    if (!existsSync(path))
      throw new ServiceUnavailableException(
        'Kho tài liệu chưa được lập chỉ mục',
      );
    const pathologyPath =
      this.config.get<string>('MEDICAL_PATHOLOGY_INDEX') ||
      resolve(process.cwd(), '..', 'Soma_Fe', 'data', 'pathology-chunks.jsonl');
    const anatomyPath =
      this.config.get<string>('MEDICAL_ANATOMY_TEXT') ||
      resolve(
        this.config.get<string>('MEDICAL_KB_ROOT') ||
          resolve(process.cwd(), 'resources', 'medical_kb'),
        'text',
        'giai-phau-yhn.txt',
      );
    const mtime =
      statSync(path).mtimeMs +
      (existsSync(pathologyPath) ? statSync(pathologyPath).mtimeMs : 0) +
      (existsSync(anatomyPath) ? statSync(anatomyPath).mtimeMs : 0);
    if (this.chunks.length && mtime === this.loadedMtime) return;
    this.chunks = readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Chunk);
    if (existsSync(pathologyPath)) {
      const rows = readFileSync(pathologyPath, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .map(
          (line) =>
            JSON.parse(line) as {
              slug: string;
              book: string;
              page: number;
              pdfPage: number;
              text: string;
            },
        );
      this.chunks.push(
        ...rows
          .filter(
            (row) =>
              /Bệnh học Nội khoa, tập [12]/.test(row.book) && row.pdfPage > 0,
          )
          .map((row) => ({
            id: `pathology:${row.slug}:${row.pdfPage}:${createHash('sha256').update(row.text).digest('hex').slice(0, 12)}`,
            sourceFile: `Bệnh học nội khoa tập ${row.book.includes('tập 1') ? '1' : '2'} Y Hà Nội 2020.pdf`,
            page: row.pdfPage,
            printedPage: row.page,
            text: row.text,
          })),
      );
    }
    if (existsSync(anatomyPath)) {
      this.chunks.push(
        ...textbookChunks(
          readFileSync(anatomyPath, 'utf8'),
          'Giải Phẫu Người Y Hà Nội 2006 Đỏ Đen.pdf',
        ),
      );
    }
    this.loadedMtime = mtime;
  }

  async search(query: string, limit: number) {
    const terms =
      query
        .toLocaleLowerCase()
        .match(/[\p{L}\p{N}-]+/gu)
        ?.filter((term) => term.length >= 2) ?? [];
    if (!terms.length) {
      throw new BadRequestException(
        'Truy vấn phải có ít nhất một từ từ 2 ký tự',
      );
    }

    this.loadIndex();
    const sources = await this.prisma.medicalSource.findMany();
    const byFile = new Map(
      sources
        .filter((source) => source.localFile && source.status !== 'archived')
        .map((source) => [source.localFile!.split(/[\\/]/).pop()!, source]),
    );
    const activeFiles = new Set(
      sources
        .filter((source) => source.status !== 'archived')
        .map((source) => source.localFile?.split(/[\\/]/).pop()),
    );
    const archivedFiles = new Set(
      sources
        .filter((source) => source.status === 'archived')
        .map((source) => source.localFile?.split(/[\\/]/).pop()),
    );
    const managed = await this.prisma.siteAsset.findMany({
      where: {
        mime: 'application/vnd.soma.source-index+json',
        filename: {
          in: [...activeFiles].filter((file): file is string => !!file),
        },
      },
      select: { filename: true, data: true },
    });
    const imported: Chunk[] = managed
      .filter((asset) => activeFiles.has(asset.filename))
      .flatMap(
        (asset) => JSON.parse(Buffer.from(asset.data).toString()) as Chunk[],
      );
    const usable = this.chunks.filter(
      (chunk) =>
        !archivedFiles.has(chunk.sourceFile) ||
        activeFiles.has(chunk.sourceFile),
    );
    const results = rankDocumentChunks(
      [...usable, ...imported],
      query,
      limit,
    ).map(({ chunk, score }) => {
      const source = byFile.get(chunk.sourceFile);
      return {
        chunkId: chunk.id,
        score,
        page: chunk.page,
        printedPage: chunk.printedPage,
        text: documentExcerpt(chunk.text, query),
        source: source ?? {
          title: chunk.sourceFile,
          localFile: chunk.sourceFile,
        },
        citation: `${source?.title ?? chunk.sourceFile}, ${chunk.printedPage ? `p. ${chunk.printedPage} (PDF ${chunk.page})` : `PDF p. ${chunk.page}`}`,
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

  /** Resolve đường dẫn PDF an toàn; chặn path-traversal.
   *  Tìm trong medical_kb/sources/ trước, rồi MEDICAL_DOCS_DIR. */
  async managedPdf(filename: string) {
    if (!/^managed-[a-f0-9-]{36}\.pdf$/.test(filename)) return null;
    const asset = await this.prisma.siteAsset.findUnique({
      where: { id: filename.slice(8, -4) },
    });
    if (!asset || asset.mime !== 'application/pdf')
      throw new NotFoundException('Không tìm thấy PDF');
    return Buffer.from(asset.data);
  }
  getPdfPath(filename: string): string {
    const safe = basename(filename);
    if (!safe || safe !== filename || !safe.endsWith('.pdf')) {
      throw new BadRequestException('Tên tệp không hợp lệ');
    }
    const kbRoot =
      this.config.get<string>('MEDICAL_KB_ROOT') ||
      resolve(process.cwd(), 'resources', 'medical_kb');
    const dirs = [resolve(kbRoot, 'sources')];
    const extra = this.config.get<string>('MEDICAL_DOCS_DIR');
    if (extra) dirs.push(resolve(extra));
    for (const dir of dirs) {
      const full = resolve(dir, safe);
      if (!full.startsWith(dir)) continue;
      if (existsSync(full)) return full;
    }
    throw new NotFoundException('Không tìm thấy tệp PDF');
  }
}
