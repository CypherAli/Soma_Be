/**
 * Bóc câu hỏi trắc nghiệm từ văn bản PDF của người dùng.
 *
 * Đây là bản TỔNG QUÁT của `Soma_Fe/scripts/kb/parse_anatomy_mcq.py` — script
 * đó viết riêng cho cấu trúc "Phần III" của giáo trình ĐH Y Hà Nội (biết trước
 * tên từng phần cơ thể, biết vùng đáp án nằm cuối mỗi phần). Tài liệu người
 * dùng tải lên thì không biết trước gì cả, nên ở đây chỉ giữ ba quy luật đủ
 * phổ biến để nhận ra một bộ đề:
 *
 *   1. câu hỏi mở đầu bằng số thứ tự ở đầu dòng: "12." hoặc "12)";
 *   2. phương án A–E nằm chung dòng hay tách dòng đều được, và chữ "C" hay bị
 *      OCR đọc thành "c" thường, dấu chấm sau nó thành khoảng trắng;
 *   3. đáp án nằm ở một vùng riêng, dạng "12-C. <lời giải>" (có giải thích) hay
 *      dạng bảng gọn "12-C 13-A 14-B" (không giải thích).
 *
 * Câu KHÔNG dò được đáp án thì bỏ và đếm lại để báo cho người tải lên biết —
 * giữ một câu không có đáp án đúng là ra đề bẫy người học.
 *
 * Bộ bóc này chắc chắn không đúng 100% với mọi tài liệu. Vì vậy mọi câu bóc ra
 * đều vào cơ sở dữ liệu ở trạng thái CHỜ DUYỆT; người tải lên phải xem rồi mới
 * dùng được. Xem `PersonalQuestion.approved`.
 */

export type ParsedQuestion = {
  number: number;
  stem: string;
  options: Record<string, string>;
  answer: string;
  explanation: string | null;
  page: number | null;
};

export type ParseReport = {
  questions: ParsedQuestion[];
  /** câu nhận ra được nhưng không dò được đáp án */
  missingAnswer: number;
  /** câu vỡ cấu trúc: dưới 3 phương án hoặc phần dẫn quá ngắn */
  malformed: number;
};

/** Chữ C thường và dấu chấm rơi mất là hai lỗi OCR gặp ở gần như mọi bản scan. */
const OPT_RE = /(?:(?<=^)|(?<=\s))([A-Ea-e])[.)]?\s+(?=\S)/g;
const Q_START_RE = /^[ \t]*(\d{1,3})[.)]\s+(?=\D)/gm;
/** "12-C." hoặc "12 – c" — kèm lời giải phía sau. */
const ANS_EXPL_RE = /^[ \t]*(\d{1,3})\s*[-–—]\s*([A-Ea-e])[.\s]/gm;
/** Tiêu đề mở đầu vùng đáp án, đứng ngay trước mục đầu tiên. */
const ANS_HEADING_RE =
  /\s*(ĐÁP\s*ÁN|DAP\s*AN|ANSWERS?(\s*KEY)?|答案)[^\n]*\s*$/i;
/** Bảng đáp án gọn: "1-A 2-B 3-C" hoặc "1.A, 2.B" nằm bất kỳ đâu trong dòng. */
const ANS_TABLE_RE = /\b(\d{1,3})\s*[-–—.:]\s*([A-Ea-e])\b(?![)\w])/g;

export function parseMcq(pages: string[]): ParseReport {
  const cleaned = pages.map(clean);
  // Mốc trang để trả lại số trang cho từng câu — người duyệt cần đối chiếu.
  const offsets: number[] = [];
  let full = '';
  for (const page of cleaned) {
    offsets.push(full.length);
    full += page + '\n';
  }

  const { answers, marks: answerMarks } = collectAnswers(full);
  const report: ParseReport = { questions: [], missingAnswer: 0, malformed: 0 };

  // KHÔNG thoát sớm khi chưa dò được đáp án nào: vẫn phải duyệt hết để đếm được
  // bao nhiêu câu bị bỏ. Báo "không nhận ra bộ đề nào" trong khi tài liệu có 40
  // câu chỉ thiếu trang đáp án là chỉ đường sai cho người tải lên.
  const starts = [...full.matchAll(Q_START_RE)];
  for (let i = 0; i < starts.length; i += 1) {
    const m = starts[i];
    const num = Number(m[1]);
    const from = (m.index ?? 0) + m[0].length;
    // Câu kết thúc ở câu kế tiếp HOẶC ở chỗ vùng đáp án bắt đầu, lấy cái nào
    // đến trước. Thiếu vế sau thì phương án cuối của câu cuối nuốt trọn cả
    // bảng đáp án phía dưới — và đó lại chính là chỗ lộ đáp án.
    const nextQuestion =
      i + 1 < starts.length
        ? (starts[i + 1].index ?? full.length)
        : full.length;
    const nextAnswer = answerMarks.find((at) => at > from) ?? full.length;
    // Cắt xong vẫn còn dính dòng tiêu đề đứng ngay trước mục đáp án đầu tiên
    // ("ĐÁP ÁN", "ANSWER KEY"…) vào phương án cuối — bỏ nốt.
    const raw = full
      .slice(from, Math.min(nextQuestion, nextAnswer))
      .replace(ANS_HEADING_RE, '');

    const { options, stem } = splitOptions(raw);
    // số trang ở chân trang hay dính vào cuối phần dẫn ("...nhất? 480")
    const cleanStem = stem.replace(/\s+\d{2,4}$/, '').trim();

    if (Object.keys(options).length < 3 || cleanStem.length < 12) {
      report.malformed += 1;
      continue;
    }
    const hit = answers.get(num);
    if (!hit || !options[hit.letter]) {
      // Không có đáp án, HOẶC khoá đáp án trỏ vào phương án không tồn tại —
      // cả hai đều là câu không dùng được, đừng đoán bừa sang phương án khác.
      report.missingAnswer += 1;
      continue;
    }

    report.questions.push({
      number: num,
      stem: cleanStem,
      options,
      answer: hit.letter,
      explanation: hit.explanation,
      page: pageOf(offsets, m.index ?? 0),
    });
  }

  return report;
}

/**
 * Gom khoá đáp án.
 *
 * Ưu tiên dạng có lời giải; bảng đáp án gọn chỉ dùng để bù số còn thiếu.
 * Không để bảng gọn chạy trước: nó khớp rất rộng nên sẽ nuốt luôn cả số thứ tự
 * của câu hỏi bình thường.
 */
function collectAnswers(full: string): {
  answers: Map<number, { letter: string; explanation: string | null }>;
  /** vị trí bắt đầu của từng mục đáp án, để cắt đuôi câu hỏi cho đúng */
  marks: number[];
} {
  const out = new Map<number, { letter: string; explanation: string | null }>();
  const marks: number[] = [];

  // Dạng có lời giải chạy TRƯỚC và được ưu tiên — nó chặt hơn (phải nằm ở đầu
  // dòng) nên gần như không báo nhầm, lại còn kèm sẵn lời giải. Ngưỡng 2 chứ
  // không phải 3: bộ đề chỉ vài câu vẫn phải bóc được, và một dòng lẻ mở đầu
  // bằng "12-C." trong tài liệu không phải bộ đề là chuyện hiếm.
  const withExpl = [...full.matchAll(ANS_EXPL_RE)];
  if (withExpl.length >= 2) {
    for (let i = 0; i < withExpl.length; i += 1) {
      const m = withExpl[i];
      const from = (m.index ?? 0) + m[0].length;
      const to =
        i + 1 < withExpl.length
          ? (withExpl[i + 1].index ?? full.length)
          : full.length;
      const explanation = full.slice(from, to).replace(/\s+/g, ' ').trim();
      out.set(Number(m[1]), {
        letter: m[2].toUpperCase(),
        explanation: explanation.length > 8 ? explanation.slice(0, 4000) : null,
      });
      marks.push(m.index ?? 0);
    }
  }

  // Bảng gọn CHỈ để BÙ những số còn thiếu — nhiều tài liệu có lời giải cho phần
  // đầu rồi cuối sách mới liệt kê bảng. Chỉ nhận dòng ĐẶC dày đáp án (>=3 cặp
  // trên một dòng) để không bắt nhầm "hình 2-A" hay "bảng 3-B" trong bài giảng.
  let lineAt = 0;
  for (const line of full.split('\n')) {
    const at = lineAt;
    lineAt += line.length + 1; // +1 cho ký tự xuống dòng đã bị split ăn mất
    const hits = [...line.matchAll(ANS_TABLE_RE)];
    if (hits.length < 3) continue;
    for (const h of hits) {
      const num = Number(h[1]);
      if (!out.has(num))
        out.set(num, { letter: h[2].toUpperCase(), explanation: null });
    }
    marks.push(at);
  }
  return { answers: out, marks: marks.sort((a, b) => a - b) };
}

/** Tách "...A. x B. y c z" thành { A: x, B: y, C: z } + phần dẫn phía trước. */
function splitOptions(block: string): {
  options: Record<string, string>;
  stem: string;
} {
  OPT_RE.lastIndex = 0;
  const marks = [...block.matchAll(OPT_RE)].map((m) => ({
    start: m.index ?? 0,
    letter: m[1].toUpperCase(),
    end: (m.index ?? 0) + m[0].length,
  }));

  // Chỉ giữ dãy TĂNG DẦN A,B,C,D,E — không thì mọi chữ cái đứng lẻ giữa câu đều
  // bị nhận nhầm là nhãn phương án.
  const seq: typeof marks = [];
  let want = 'A';
  for (const mark of marks) {
    if (mark.letter !== want) continue;
    seq.push(mark);
    want = String.fromCharCode(want.charCodeAt(0) + 1);
  }
  if (seq.length < 2) return { options: {}, stem: block.trim() };

  const options: Record<string, string> = {};
  for (let i = 0; i < seq.length; i += 1) {
    const stop = i + 1 < seq.length ? seq[i + 1].start : block.length;
    const text = block
      .slice(seq[i].end, stop)
      .replace(/\s+/g, ' ')
      .replace(/^[.\s]+|[.;\s]+$/g, '');
    if (text) options[seq[i].letter] = text.slice(0, 600);
  }
  return {
    options,
    stem: block
      .slice(0, seq[0].start)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000),
  };
}

function clean(s: string): string {
  return (
    (s ?? '')
      .normalize('NFC')
      // Khoảng trắng không ngắt (U+00A0) do PDF sinh ra phải đổi thành khoảng
      // trắng thường, không thì mọi regex tách phương án đều trượt.
      // eslint-disable-next-line no-irregular-whitespace
      .replace(/ /g, ' ')
      // OCR hay chèn khoảng trắng vào giữa các chữ viết tắt y khoa
      .replace(/\bĐ\s+M\b/g, 'ĐM')
      .replace(/\bT\s+M\b/g, 'TM')
      .replace(/\bT\s+K\b/g, 'TK')
      .replace(/[ \t]+/g, ' ')
  );
}

function pageOf(offsets: number[], at: number): number | null {
  for (let i = offsets.length - 1; i >= 0; i -= 1) {
    if (at >= offsets[i]) return i + 1;
  }
  return null;
}
