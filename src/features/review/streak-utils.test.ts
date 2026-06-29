import { describe, it, expect } from 'vitest';
import { isSameUtcDay, isYesterdayUtc, nextStreak, effectiveStreak } from './streak-utils';

const today = new Date('2026-06-29T10:00:00.000Z');
const sameDay = new Date('2026-06-29T23:30:00.000Z');
const yesterday = new Date('2026-06-28T01:00:00.000Z');
const twoDaysAgo = new Date('2026-06-27T12:00:00.000Z');

describe('date helpers', () => {
  it('isSameUtcDay', () => {
    expect(isSameUtcDay(sameDay, today)).toBe(true);
    expect(isSameUtcDay(yesterday, today)).toBe(false);
    expect(isSameUtcDay(null, today)).toBe(false);
  });
  it('isYesterdayUtc', () => {
    expect(isYesterdayUtc(yesterday, today)).toBe(true);
    expect(isYesterdayUtc(twoDaysAgo, today)).toBe(false);
    expect(isYesterdayUtc(sameDay, today)).toBe(false);
  });
});

describe('nextStreak', () => {
  it('first ever activity → streak 1', () => {
    expect(nextStreak({ currentStreak: 0, longestStreak: 0, lastActiveDate: null }, today))
      .toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it('second activity same day → unchanged', () => {
    expect(nextStreak({ currentStreak: 5, longestStreak: 9, lastActiveDate: sameDay }, today))
      .toEqual({ currentStreak: 5, longestStreak: 9 });
  });

  it('consecutive day → +1, longest tracked', () => {
    expect(nextStreak({ currentStreak: 5, longestStreak: 5, lastActiveDate: yesterday }, today))
      .toEqual({ currentStreak: 6, longestStreak: 6 });
  });

  it('gap → reset to 1, longest preserved', () => {
    expect(nextStreak({ currentStreak: 8, longestStreak: 8, lastActiveDate: twoDaysAgo }, today))
      .toEqual({ currentStreak: 1, longestStreak: 8 });
  });
});

describe('effectiveStreak', () => {
  it('alive when last active today or yesterday', () => {
    expect(effectiveStreak(5, sameDay, today)).toBe(5);
    expect(effectiveStreak(5, yesterday, today)).toBe(5);
  });
  it('lapsed when last active is older', () => {
    expect(effectiveStreak(5, twoDaysAgo, today)).toBe(0);
    expect(effectiveStreak(0, null, today)).toBe(0);
  });
});
