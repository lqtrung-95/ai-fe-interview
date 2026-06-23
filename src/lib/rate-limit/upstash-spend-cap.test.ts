import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Each describe block resets the module so the init() singleton restarts cleanly.

describe('isDailySpendCapExceeded — dev mode (no Upstash env)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('always returns false when Upstash is unconfigured (dev pass-through)', async () => {
    const { isDailySpendCapExceeded } = await import('./upstash');
    expect(await isDailySpendCapExceeded(5)).toBe(false);
    expect(await isDailySpendCapExceeded(100)).toBe(false);
  });
});

describe('isDailySpendCapExceeded — production fail-closed guard', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws on first call when Upstash is not configured in production', async () => {
    const { isDailySpendCapExceeded } = await import('./upstash');
    await expect(isDailySpendCapExceeded(0)).rejects.toThrow(
      'UPSTASH_REDIS_REST_URL / TOKEN are not set in production'
    );
  });
});

describe('isDailySpendCapExceeded — with mocked Redis', () => {
  const mockPipeline = {
    incrbyfloat: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  };
  const mockRedisInstance = { pipeline: vi.fn(() => mockPipeline) };

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.doMock('@upstash/redis', () => ({
      Redis: vi.fn(() => mockRedisInstance),
    }));
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: Object.assign(
        vi.fn(() => ({ limit: vi.fn() })),
        { slidingWindow: vi.fn(() => ({})) }
      ),
    }));
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@upstash/redis');
    vi.doUnmock('@upstash/ratelimit');
  });

  it('returns false when cumulative spend is under the default $10 cap', async () => {
    mockPipeline.exec.mockResolvedValue([3.5, 1]);
    const { isDailySpendCapExceeded } = await import('./upstash');
    expect(await isDailySpendCapExceeded(0.5)).toBe(false);
  });

  it('returns true and logs when cumulative spend exceeds the cap', async () => {
    mockPipeline.exec.mockResolvedValue([10.01, 1]);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { isDailySpendCapExceeded } = await import('./upstash');
    expect(await isDailySpendCapExceeded(0.01)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[spend-cap]'),
      expect.objectContaining({ cap: 10 })
    );
    consoleSpy.mockRestore();
  });

  it('respects DAILY_SPEND_CAP_USD env override', async () => {
    vi.stubEnv('DAILY_SPEND_CAP_USD', '50');
    mockPipeline.exec.mockResolvedValue([12, 1]); // over default $10 but under $50
    const { isDailySpendCapExceeded } = await import('./upstash');
    expect(await isDailySpendCapExceeded(1)).toBe(false);
  });
});
