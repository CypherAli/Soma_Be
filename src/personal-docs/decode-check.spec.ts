import { decodeFilename, fixPdfText } from './personal-docs.service';

/**
 * Tái hiện đúng kiểu vỡ của multer: byte UTF-8 bị đọc thành latin1.
 * Dựng chuỗi vỡ từ byte trong code để shell/powershell không làm hỏng chữ.
 */
function garble(s: string): string {
  return Buffer.from(s, 'utf8').toString('latin1');
}

describe('decodeFilename', () => {
  it('giải đúng tên "Review đề Giải Phẫu ch 2024 (1).docx" bị vỡ', () => {
    const original = 'Review đề Giải Phẫu ch 2024 (1).docx';
    expect(decodeFilename(garble(original))).toBe(original);
  });

  it('không chạm vào tên đã đúng và tên ASCII', () => {
    expect(decodeFilename('Triệu chứng học nội khoa tập 2.pdf')).toBe(
      'Triệu chứng học nội khoa tập 2.pdf',
    );
    expect(decodeFilename('review-de-2024.docx')).toBe('review-de-2024.docx');
    expect(decodeFilename('')).toBe('');
  });
});

describe('fixPdfText', () => {
  it('sửa trang vỡ mã hoá, giữ nguyên trang đúng', () => {
    const original =
      'Cơ nhị đầu cánh tay gấp cẳng tay, chi phối bởi thần kinh cơ bì.';
    expect(fixPdfText(garble(original))).toBe(original);
    expect(fixPdfText(original)).toBe(original);
    expect(fixPdfText('')).toBe('');
  });
});
