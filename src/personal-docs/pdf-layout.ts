import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { ParsedQuestion } from './mcq-parser';

export type LayoutQuestion = ParsedQuestion & {
  answers: string[];
  context: string | null;
  images: string[];
  explanationImages: string[];
  reviewNote: string | null;
};

type LayoutResult = {
  recognized: boolean;
  pages: string[];
  questions: LayoutQuestion[];
};

/** The PDF is sent over stdin only. Derived figures stay in the private bank. */
export function readPdfLayout(
  data: Buffer,
  python: string,
): Promise<LayoutResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      python,
      [join(process.cwd(), 'scripts/pdf_quiz/extract.py')],
      {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const chunks: Buffer[] = [];
    let size = 0;
    let failure: Error | null = null;
    const stop = (message: string) => {
      failure = new Error(message);
      child.kill();
    };
    const timer = setTimeout(
      () =>
        stop(
          'Phân tích PDF quá thời gian. Hãy tách tài liệu thành phần nhỏ hơn.',
        ),
      120_000,
    );
    child.on('error', () => {
      clearTimeout(timer);
      reject(new Error('Bộ đọc bố cục PDF chưa sẵn sàng trên máy chủ.'));
    });
    child.stdout.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 96 * 1024 * 1024)
        stop('Tài liệu có quá nhiều ảnh. Hãy tách thành phần nhỏ hơn.');
      else chunks.push(chunk);
    });
    // Drain stderr without exposing document fragments or local paths in API errors.
    child.stderr.resume();
    child.stdin.on('error', () => {
      /* close handles failed readers */
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (failure) return reject(failure);
      if (code !== 0)
        return reject(
          new Error(
            'Không phân tích được bố cục PDF. Kiểm tra tệp hoặc thử lại sau.',
          ),
        );
      try {
        const result = JSON.parse(
          Buffer.concat(chunks).toString('utf8'),
        ) as LayoutResult;
        if (!Array.isArray(result.pages) || !Array.isArray(result.questions))
          throw new Error('Invalid layout');
        resolve(result);
      } catch {
        reject(
          new Error('Kết quả phân tích PDF chưa đầy đủ. Vui lòng thử lại.'),
        );
      }
    });
    child.stdin.end(data);
  });
}
