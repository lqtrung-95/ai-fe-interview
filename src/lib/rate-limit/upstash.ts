import 'server-only';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Two limiters:
 *   - aiCallLimiter     — 30 AI-bearing requests per hour per userId
 *   - generalApiLimiter — 120 requests per minute per userId-or-IP
 *
 * In production, Upstash MUST be configured — we throw at startup rather than
 * silently allowing unlimited AI spend with no protection.
 */

let _redis: Redis | null = null;
let _aiLimiter: Ratelimit | null = null;
let _generalLimiter: Ratelimit | null = null;
let _initTried = false;

function init(): void {
  if (_initTried) return;
  _initTried = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const missing = !url || !token || url.includes('placeholder') || token === 'placeholder';

  if (missing) {
    if (process.env.NODE_ENV === 'production') {
      // Fail hard — unconfigured rate limiting in prod = unlimited AI spend.
      throw new Error('[rate-limit] UPSTASH_REDIS_REST_URL / TOKEN are not set in production. Refusing to start.');
    }
    return; // dev/test — limiters stay null, all requests pass
  }

  _redis = new Redis({ url, token });
  _aiLimiter = new Ratelimit({
    redis: _redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    prefix: 'rl:ai',
    analytics: false,
  });
  _generalLimiter = new Ratelimit({
    redis: _redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    prefix: 'rl:gen',
    analytics: false,
  });
}

export interface LimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkAILimit(identifier: string): Promise<LimitResult> {
  init();
  if (!_aiLimiter) return { ok: true, remaining: 999, resetAt: Date.now() + 3_600_000 };
  const r = await _aiLimiter.limit(identifier);
  return { ok: r.success, remaining: r.remaining, resetAt: r.reset };
}

export async function checkGeneralLimit(identifier: string): Promise<LimitResult> {
  init();
  if (!_generalLimiter) return { ok: true, remaining: 999, resetAt: Date.now() + 60_000 };
  const r = await _generalLimiter.limit(identifier);
  return { ok: r.success, remaining: r.remaining, resetAt: r.reset };
}

/**
 * Daily total AI spend cap — fail-closed circuit breaker.
 * Tracks cumulative USD spend in Redis for the UTC day key.
 * Returns true when the cap is exceeded (caller should 503).
 */
const DAILY_SPEND_CAP_USD = Number(process.env.DAILY_SPEND_CAP_USD ?? 10);

export async function isDailySpendCapExceeded(addCostUsd: number): Promise<boolean> {
  init();
  if (!_redis) return false; // dev — no cap enforcement

  const dayKey = `spend:${new Date().toISOString().slice(0, 10)}`; // e.g. "spend:2026-06-23"
  const pipeline = _redis.pipeline();
  pipeline.incrbyfloat(dayKey, addCostUsd);
  pipeline.expire(dayKey, 60 * 60 * 25); // keep for 25 h so yesterday's key is still readable
  const [totalStr] = await pipeline.exec<[number, number]>();
  const total = typeof totalStr === 'number' ? totalStr : 0;

  if (total > DAILY_SPEND_CAP_USD) {
    console.error('[spend-cap] daily AI spend cap exceeded', { total, cap: DAILY_SPEND_CAP_USD });
    return true;
  }
  return false;
}
