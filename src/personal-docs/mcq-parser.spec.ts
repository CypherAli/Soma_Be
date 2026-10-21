import { parseMcq } from './mcq-parser';

/**
 * Các trang dưới đây mô phỏng đúng ba cái khó của bản PDF scan thật, vì đó mới
 * là thứ bộ bóc phải chịu được: phương án nằm chung một dòng, chữ "C" bị đọc
 * thành "c" thường mất dấu chấm, và vùng đáp án nằm ở trang khác.
 */
const QUESTION_PAGE = `NGÂN HÀNG CÂU HỎI GIẢI PHẪU CHI TRÊN
1. Cơ nào sau đây gấp cẳng tay tại khớp khuỷu? A. Cơ tam đầu cánh tay B. Cơ nhị đầu cánh tay c Cơ delta D. Cơ ngực lớn E. Cơ thang
2. Thần kinh nào chi phối cơ delta?
A. TK quay
B. TK trụ
C. TK nách
D. TK giữa
E. TK cơ bì
3. Xương nào thuộc hàng gần của khối xương cổ tay? A. Xương thuyền B. Xương cả c Xương móc D. Xương thang E. Xương thê`;

const ANSWER_PAGE = `ĐÁP ÁN
1-B. Cơ nhị đầu cánh tay gấp cẳng tay và ngửa cẳng tay.
2-C. TK nách tách từ bó sau đám rối cánh tay, chi phối cơ delta và cơ tròn bé.
3-A. Xương thuyền nằm ở hàng gần, cạnh xương nguyệt.`;

describe('parseMcq', () => {
  it('does not lose a numbered question whose stem begins with a number', () => {
    const report = parseMcq([
      'Câu hỏi 3:\n12 đôi dây thần kinh sọ xuất phát từ đâu?\nA. Phương án một\nB. Phương án hai\nC. Phương án ba\nĐáp án: A',
    ]);
    expect(report.questions[0]?.number).toBe(3);
    expect(report.questions[0]?.stem).toContain('12 đôi');
  });

  it('recognises Câu hỏi N headings with standalone option labels and explicit keys', () => {
    const report = parseMcq([
      `Câu hỏi 1:
Liên quan đúng của tk giữa là:
A
nó bắt chéo sau động mạch cánh tay.
B
ở khuỷu nó nằm sau trẽ gân cơ nhị đầu.
C
nó đi sau cơ sấp tròn.
D
ở cẳng tay, càng xuống dưới nó càng gần bờ trong cơ gấp các ngón nông.
Đáp án: B`,
    ]);
    expect(report.questions).toHaveLength(1);
    expect(report.questions[0]).toMatchObject({
      number: 1,
      stem: 'Liên quan đúng của tk giữa là:',
      answer: 'B',
      page: 1,
    });
    expect(report.questions[0].options.D).toBe(
      'ở cẳng tay, càng xuống dưới nó càng gần bờ trong cơ gấp các ngón nông',
    );
  });

  it('counts numbered source questions without inventing keys lost with PDF colours', () => {
    const report = parseMcq([
      `Câu hỏi 1:
Liên quan đúng của tk giữa là:
A
nó bắt chéo sau động mạch cánh tay.
B
ở khuỷu nó nằm sau trẽ gân cơ nhị đầu.
C
nó đi sau cơ sấp tròn.
D
ở cẳng tay, càng xuống dưới nó càng gần bờ trong cơ gấp các ngón nông.`,
    ]);
    expect(report.questions).toEqual([]);
    expect(report.missingAnswer).toBe(1);
    expect(report.malformed).toBe(0);
  });

  it('bóc được câu có phương án chung dòng và vùng đáp án kèm lời giải', () => {
    const report = parseMcq([QUESTION_PAGE, ANSWER_PAGE]);

    expect(report.questions).toHaveLength(3);
    const [first, second] = report.questions;

    expect(first.stem).toBe('Cơ nào sau đây gấp cẳng tay tại khớp khuỷu?');
    expect(first.answer).toBe('B');
    expect(first.options.B).toBe('Cơ nhị đầu cánh tay');
    // chữ "c" thường vẫn phải thành phương án C
    expect(first.options.C).toBe('Cơ delta');
    expect(first.explanation).toContain('gấp cẳng tay');
    expect(first.page).toBe(1);

    // phương án tách dòng cũng phải ra đủ
    expect(Object.keys(second.options)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(second.answer).toBe('C');
  });

  it('đọc được bảng đáp án gọn khi tài liệu không có lời giải', () => {
    const report = parseMcq([QUESTION_PAGE, 'Đáp án: 1-B 2-C 3-A']);

    expect(report.questions.map((q) => `${q.number}${q.answer}`)).toEqual([
      '1B',
      '2C',
      '3A',
    ]);
    expect(report.questions[0].explanation).toBeNull();
  });

  it('không nhận nhầm số hiệu hình vẽ rải rác thành bảng đáp án', () => {
    // Một trang bài giảng bình thường: có "hình 2-A" nhưng KHÔNG phải khoá đáp án.
    const report = parseMcq([
      QUESTION_PAGE,
      'Xem hình 2-A ở trang sau để đối chiếu.',
    ]);

    expect(report.questions).toHaveLength(0);
    expect(report.missingAnswer).toBe(3);
  });

  it('bỏ câu mà khoá đáp án trỏ vào phương án không tồn tại', () => {
    // Câu 1 chỉ có A–E; khoá "1-F" là hỏng, không được đoán sang phương án khác.
    const report = parseMcq([
      QUESTION_PAGE,
      '1-F. Lời giải nào đó.\n2-C. abc\n3-A. xyz',
    ]);

    expect(report.questions.map((q) => q.number)).toEqual([2, 3]);
    expect(report.missingAnswer).toBe(1);
  });

  it('không để phương án cuối nuốt luôn vùng đáp án phía dưới', () => {
    // Vùng đáp án nằm NGAY SAU câu cuối trên cùng một trang: nếu cắt câu chỉ
    // theo "câu kế tiếp" thì phương án E của câu 3 kéo hết cả bảng đáp án vào,
    // và đáp án hiện luôn trong phương án.
    const oneBlock = `${QUESTION_PAGE}
${ANSWER_PAGE}`;

    const report = parseMcq([oneBlock]);

    expect(report.questions).toHaveLength(3);
    const last = report.questions[2];
    expect(last.options.E).toBe('Xương thê');
    expect(Object.values(last.options).join(' ')).not.toContain('ĐÁP ÁN');
    expect(Object.values(last.options).join(' ')).not.toContain(
      'hàng gần, cạnh',
    );
  });

  it('trả về rỗng khi tài liệu không phải bộ đề', () => {
    const report = parseMcq([
      'Chương 1: Đại cương giải phẫu học.\nCơ thể người gồm nhiều hệ.',
    ]);

    expect(report.questions).toHaveLength(0);
  });

  it('nhận câu viết "Câu N." kiểu file Review Word', () => {
    const report = parseMcq([
      `Câu 1. Cơ nào gấp cẳng tay? A. Cơ tam đầu B. Cơ nhị đầu C. Cơ delta D. Cơ ngực lớn E. Cơ thang. Đáp án: B
Câu 2: Thần kinh nào chi phối cơ delta? A. TK quay B. TK trụ C. TK nách D. TK giữa E. TK cơ bì (đáp án C)`,
    ]);

    expect(report.questions.map((q) => `${q.number}${q.answer}`)).toEqual([
      '1B',
      '2C',
    ]);
    expect(report.questions[0].options.B).toBe('Cơ nhị đầu');
    expect(report.questions[0].explanation).toBeNull();
    // đáp án inline không được dính vào phương án cuối
    expect(report.questions[0].options.E).toBe('Cơ thang');
  });
});
