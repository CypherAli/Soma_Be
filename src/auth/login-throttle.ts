/**
 * Chống brute-force đăng nhập: tối đa 5 lần sai / 15 phút / mỗi email+IP.
 * Lưu trong RAM (đủ cho 1 instance đồ án; deploy nhiều instance thì thay bằng Redis).
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const MAX_KEYS = 5000;

type Entry = { fails: number; firstAt: number };
const buckets = new Map<string, Entry>();

export function loginKey(email: string, ip?: string) {
  return `${(email ?? '').trim().toLowerCase()}|${ip ?? 'unknown'}`;
}

export function checkLoginThrottle(key: string): {
  blocked: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const e = buckets.get(key);
  if (!e) return { blocked: false, retryAfterSec: 0 };
  if (now - e.firstAt >= WINDOW_MS) {
    buckets.delete(key);
    return { blocked: false, retryAfterSec: 0 };
  }
  if (e.fails >= MAX_FAILS) {
    return {
      blocked: true,
      retryAfterSec: Math.ceil((WINDOW_MS - (now - e.firstAt)) / 1000),
    };
  }
  return { blocked: false, retryAfterSec: 0 };
}

export function recordLoginFail(key: string) {
  const now = Date.now();
  const e = buckets.get(key);
  if (!e || now - e.firstAt >= WINDOW_MS) {
    // Remove expired keys before enforcing the memory ceiling.
    if (buckets.size >= MAX_KEYS) {
      for (const [entryKey, entry] of buckets) {
        if (now - entry.firstAt >= WINDOW_MS) buckets.delete(entryKey);
      }
      if (buckets.size >= MAX_KEYS) {
        for (const oldest of buckets.keys()) {
          buckets.delete(oldest);
          break;
        }
      }
    }
    buckets.set(key, { fails: 1, firstAt: now });
  } else {
    e.fails += 1;
  }
}

export function recordLoginSuccess(key: string) {
  buckets.delete(key);
}
