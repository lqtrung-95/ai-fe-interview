import 'server-only';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Two limiters:
 *   - aiCallLimiter     — 30 AI-bearing requests per hour per userId. Applies to
 *                          the question-generate and feedback-generate routes.
 *   - generalApiLimiter — 120 requests per minute per userId-or-IP for the rest.
 *
 * Returns null when Upstash is not configured (dev convenience). Callers must
 * treat null as "allow" but never in production — guarded by env check at deploy.
 */

let _aiLimiter: Ratelimit | null = null;
let _generalLimiter: Ratelimit | null = null;
let _initTried = false;

function init(): void {
  if (_initTried) return;
  _initTried = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes('placeholder') || token === 'placeholder') {
    return; // dev — limiters stay null, all requests pass
  }

  const redis = new Redis({ url, token });
  _aiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    prefix: 'rl:ai',
    analytics: false,
  });
  _generalLimiter = new Ratelimit({
    redis,
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
