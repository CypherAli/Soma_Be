export const PDF_MIME = 'application/pdf';
export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
import { readPdfLayout, type LayoutQuestion } from './pdf-layout';

/**
 * Đọc văn bản từng trang từ PDF hoặc Word (.docx).
 *
 * Cả hai thư viện đều nạp động để tiến trình khởi động không phải kéo theo bộ
 * máy đọc file khi chưa ai tải tài liệu nào lên. Word không có khái niệm trang
 * nên cắt văn bản thành từng đoạn ~4000 ký tự làm "trang giả" — đủ để bộ bóc
 * gắn số trang đối chiếu và AI trả lại `page` cho từng câu.
 */
export async function readDocument(
  data: Buffer,
  mimetype: string,
  python = 'python',
): Promise<{ pages: string[]; questions?: LayoutQuestion[] }> {
  if (mimetype === DOCX_MIME) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: data });
    const text = result.value ?? '';
    if (!text.trim()) throw new Error('Không đọc được chữ trong file Word này');
    return { pages: splitPseudoPages(text) };
  }
  const layout = await readPdfLayout(data, python);
  if (layout.recognized)
    return { pages: layout.pages, questions: layout.questions };
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    const pages = (result.pages ?? []).map((p) => p.text ?? '');
    return { pages: pages.length ? pages : [result.text ?? ''] };
  } finally {
    await parser.destroy();
  }
}

/** Cắt văn bản Word thành trang giả theo đoạn văn, mỗi trang ~4000 ký tự. */
function splitPseudoPages(text: string): string[] {
  const PAGE_CHARS = 4000;
  const paragraphs = text.split(/\n{2,}|\r?\n/);
  const pages: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if ((current + para).length > PAGE_CHARS && current.trim()) {
      pages.push(current.trim());
      current = '';
    }
    current += (current ? '\n' : '') + para;
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length ? pages : [text];
}
