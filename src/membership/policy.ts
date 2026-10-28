export const PREMIUM_PRICE = 25000;
export const PREMIUM_DESCRIPTION = 'Premium soma';

export function monthWindow(now = new Date()) {
  const local = new Date(now.getTime() + 7 * 3600000);
  const year = local.getUTCFullYear(),
    month = local.getUTCMonth();
  return {
    month: `${year}-${String(month + 1).padStart(2, '0')}`,
    resetsAt: new Date(Date.UTC(year, month + 1, 1) - 7 * 3600000),
  };
}

export function activePlan(
  user: {
    plan: string;
    premiumUntil: Date | null;
    sandboxPremiumUntil?: Date | null;
  },
  now = new Date(),
  sandbox = false,
) {
  return (user.plan === 'pro' &&
    user.premiumUntil &&
    user.premiumUntil > now) ||
    (sandbox && user.sandboxPremiumUntil && user.sandboxPremiumUntil > now)
    ? 'pro'
    : 'free';
}

export function addPremiumMonth(from: Date) {
  const date = new Date(from.getTime() + 7 * 3600000),
    day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return new Date(date.getTime() - 7 * 3600000);
}
