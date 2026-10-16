import { checkAccess, FREE_DAILY_LIMIT, freeRemaining, recordStart, type DailyUsage } from '../src/logic/access';
import { daysBetween, isoWeekId, localDayKey } from '../src/logic/dates';
import { normalizeAnswer, shuffle, starsFor } from '../src/logic/scoring';

describe('dates', () => {
  it('computes ISO week ids, including year boundaries', () => {
    expect(isoWeekId(new Date(2026, 9, 16))).toBe('2026-W42');
    expect(isoWeekId(new Date(2026, 0, 1))).toBe('2026-W01');
    expect(isoWeekId(new Date(2027, 0, 1))).toBe('2026-W53');
    expect(isoWeekId(new Date(2024, 11, 30))).toBe('2025-W01');
  });

  it('formats local day keys and diffs them', () => {
    expect(localDayKey(new Date(2026, 2, 5))).toBe('2026-03-05');
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysBetween('2026-10-16', '2026-10-16')).toBe(0);
  });
});

describe('free tier access', () => {
  const today = '2026-10-16';
  const base = { isPremium: false, isCurrentWeek: true, today };

  it(`allows ${FREE_DAILY_LIMIT} new activities a day, then blocks`, () => {
    let usage: DailyUsage | undefined;
    for (let i = 0; i < FREE_DAILY_LIMIT; i++) {
      const d = checkAccess({ ...base, key: `w/a${i}`, usage });
      expect(d.allowed).toBe(true);
      usage = recordStart(usage, today, `w/a${i}`);
    }
    expect(checkAccess({ ...base, key: 'w/extra', usage })).toEqual({ allowed: false, reason: 'daily-limit' });
    expect(freeRemaining(usage, today)).toBe(0);
  });

  it('lets a child replay an activity already started today', () => {
    let usage = recordStart(undefined, today, 'w/a');
    usage = recordStart(usage, today, 'w/b');
    expect(checkAccess({ ...base, key: 'w/a', usage })).toMatchObject({ allowed: true, reason: 'replay' });
  });

  it('does not double count re-opening the same activity', () => {
    const usage = recordStart(recordStart(undefined, today, 'w/a'), today, 'w/a');
    expect(usage.activityKeys).toEqual(['w/a']);
  });

  it('resets the next day', () => {
    const usage = recordStart(recordStart(undefined, today, 'w/a'), today, 'w/b');
    expect(checkAccess({ ...base, today: '2026-10-17', key: 'w/c', usage }).allowed).toBe(true);
    expect(freeRemaining(usage, '2026-10-17')).toBe(FREE_DAILY_LIMIT);
  });

  it('locks past weeks for free users only', () => {
    expect(checkAccess({ ...base, isCurrentWeek: false, key: 'old/a', usage: undefined })).toEqual({
      allowed: false,
      reason: 'past-week',
    });
    expect(checkAccess({ ...base, isPremium: true, isCurrentWeek: false, key: 'old/a', usage: undefined }).allowed).toBe(true);
  });

  it('never limits premium', () => {
    const usage = recordStart(recordStart(undefined, today, 'w/a'), today, 'w/b');
    expect(checkAccess({ ...base, isPremium: true, key: 'w/z', usage }).allowed).toBe(true);
  });
});

describe('scoring', () => {
  it('awards stars by first-try accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(0, 5)).toBe(1);
    expect(starsFor(0, 0)).toBe(1);
  });

  it('normalizes typed answers', () => {
    expect(normalizeAnswer('  X =  8. ')).toBe('x = 8');
  });

  it('shuffles without losing items', () => {
    const items = [1, 2, 3, 4, 5];
    expect(shuffle(items).sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});
