/**
 * Free vs. paid rules. Kept pure so they are easy to test and to tweak.
 *
 * - Premium: everything, including past weeks.
 * - Free: FREE_DAILY_LIMIT new activities per device per day, current week only.
 *   Re-opening an activity already started today does not use another slot.
 */
export const FREE_DAILY_LIMIT = 2;

export interface DailyUsage {
  day: string;
  activityKeys: string[];
}

export type AccessDecision =
  | { allowed: true; reason: 'premium' | 'replay' | 'free'; remainingAfter: number }
  | { allowed: false; reason: 'daily-limit' | 'past-week' };

export function activityKey(weekId: string, activityId: string): string {
  return `${weekId}/${activityId}`;
}

export function usageForDay(usage: DailyUsage | undefined, today: string): DailyUsage {
  return usage && usage.day === today ? usage : { day: today, activityKeys: [] };
}

export function freeRemaining(usage: DailyUsage | undefined, today: string): number {
  return Math.max(0, FREE_DAILY_LIMIT - usageForDay(usage, today).activityKeys.length);
}

export function checkAccess(args: {
  isPremium: boolean;
  key: string;
  isCurrentWeek: boolean;
  usage: DailyUsage | undefined;
  today: string;
}): AccessDecision {
  const { isPremium, key, isCurrentWeek, usage, today } = args;
  if (isPremium) return { allowed: true, reason: 'premium', remainingAfter: Infinity };
  if (!isCurrentWeek) return { allowed: false, reason: 'past-week' };

  const todays = usageForDay(usage, today);
  const remaining = FREE_DAILY_LIMIT - todays.activityKeys.length;
  if (todays.activityKeys.includes(key)) {
    return { allowed: true, reason: 'replay', remainingAfter: Math.max(0, remaining) };
  }
  if (remaining <= 0) return { allowed: false, reason: 'daily-limit' };
  return { allowed: true, reason: 'free', remainingAfter: remaining - 1 };
}

export function recordStart(usage: DailyUsage | undefined, today: string, key: string): DailyUsage {
  const todays = usageForDay(usage, today);
  if (todays.activityKeys.includes(key)) return todays;
  return { day: today, activityKeys: [...todays.activityKeys, key] };
}
