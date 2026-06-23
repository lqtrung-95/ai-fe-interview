import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// vi.hoisted ensures these refs are available inside the hoisted vi.mock factory
const { mockUserUpdate, mockSessionCount } = vi.hoisted(() => ({
  mockUserUpdate: vi.fn(),
  mockSessionCount: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: { update: mockUserUpdate },
    interviewSession: { count: mockSessionCount },
  },
}));

import { isProUser, hasDailyLimitReached } from './subscription-service';

beforeEach(() => vi.clearAllMocks());

// ── isProUser ──────────────────────────────────────────────────────────────────

describe('isProUser', () => {
  it('returns false when isPro is false', async () => {
    expect(await isProUser({ id: 'u1', isPro: false, proExpiresAt: null })).toBe(false);
  });

  it('returns true for permanent subscriber (no expiry)', async () => {
    expect(await isProUser({ id: 'u1', isPro: true, proExpiresAt: null })).toBe(true);
  });

  it('returns true when promo expiry is in the future', async () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(await isProUser({ id: 'u1', isPro: true, proExpiresAt: future })).toBe(true);
  });

  it('returns false and lazy-revokes when promo expiry has passed', async () => {
    mockUserUpdate.mockResolvedValue({});
    const past = new Date(Date.now() - 1000);
    const result = await isProUser({ id: 'u1', isPro: true, proExpiresAt: past });
    expect(result).toBe(false);
    // give the fire-and-forget revoke a tick to complete
    await vi.waitFor(() =>
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isPro: false },
      })
    );
  });
});

// ── hasDailyLimitReached ───────────────────────────────────────────────────────

describe('hasDailyLimitReached', () => {
  it('never blocks a Pro user regardless of session count', async () => {
    expect(
      await hasDailyLimitReached({ id: 'u1', isPro: true, proExpiresAt: null })
    ).toBe(false);
    expect(mockSessionCount).not.toHaveBeenCalled();
  });

  it('returns false when free user has 0 sessions today', async () => {
    mockSessionCount.mockResolvedValue(0);
    expect(
      await hasDailyLimitReached({ id: 'u1', isPro: false, proExpiresAt: null })
    ).toBe(false);
  });

  it('returns true when free user has reached the daily cap (1 session)', async () => {
    mockSessionCount.mockResolvedValue(1);
    expect(
      await hasDailyLimitReached({ id: 'u1', isPro: false, proExpiresAt: null })
    ).toBe(true);
  });

  it('returns true when free user has exceeded the daily cap', async () => {
    mockSessionCount.mockResolvedValue(3);
    expect(
      await hasDailyLimitReached({ id: 'u1', isPro: false, proExpiresAt: null })
    ).toBe(true);
  });
});
