/**
 * Lịch ôn theo khoảng cách — SM-2 rút gọn.
 *
 * Chỉ giữ phần cốt lõi của SM-2: trả lời đúng thì giãn khoảng cách theo hệ số
 * dễ, trả lời sai thì kéo về ôn lại ngay hôm sau và hạ hệ số. Bỏ thang tự chấm
 * 0–5 của SM-2 gốc vì trắc nghiệm chỉ có đúng/sai — hỏi người học "bạn thấy câu
 * này dễ mức mấy" sau mỗi câu là thêm một bước không ai bấm thật lòng.
 *
 * Hàm thuần, không đụng cơ sở dữ liệu, để test được và để cùng một công thức
 * dùng lại được ở phía web khi chưa đăng nhập.
 */
export type ReviewState = {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
};

export const INITIAL_REVIEW: ReviewState = {
  ease: 2.5,
  intervalDays: 0,
  reps: 0,
  lapses: 0,
};

/** Hệ số dễ không xuống dưới mức này, không thì câu khó kẹt lại mãi mỗi ngày. */
const MIN_EASE = 1.3;
/** Trần khoảng cách: quá một năm thì việc lên lịch không còn ý nghĩa học tập. */
const MAX_INTERVAL_DAYS = 365;

export function nextReview(
  prev: ReviewState,
  correct: boolean,
  now = new Date(),
) {
  const state = { ...INITIAL_REVIEW, ...prev };

  if (!correct) {
    // Sai thì học lại từ đầu nhưng GIỮ số lần đã gặp: `lapses` cho biết câu này
    // hay quên, dùng để xếp câu yếu lên trước trong buổi ôn.
    const ease = Math.max(MIN_EASE, state.ease - 0.2);
    return {
      ease,
      intervalDays: 1,
      reps: 0,
      lapses: state.lapses + 1,
      dueAt: addDays(now, 1),
    };
  }

  const reps = state.reps + 1;
  const intervalDays = Math.min(
    MAX_INTERVAL_DAYS,
    reps === 1
      ? 1
      : reps === 2
        ? 3
        : Math.round(state.intervalDays * state.ease),
  );
  // Đúng thì thưởng nhẹ hệ số dễ — nhẹ thôi, SM-2 gốc cũng chỉ +0.1 ở mức tốt.
  const ease = Math.min(3.0, state.ease + 0.1);

  return {
    ease,
    intervalDays,
    reps,
    lapses: state.lapses,
    dueAt: addDays(now, intervalDays),
  };
}

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Số câu vừa một buổi học.
 *
 * Lấy 45 giây mỗi câu — cùng nhịp với chế độ thi thử ở trang quiz, để "25 phút
 * mỗi ngày" người dùng chọn ra đúng số câu họ thật sự làm kịp.
 */
export function questionsForMinutes(minutes: number): number {
  return Math.max(5, Math.min(60, Math.round((minutes * 60) / 45)));
}
