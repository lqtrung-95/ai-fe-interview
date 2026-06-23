import 'server-only';
import { NextResponse } from 'next/server';
import { checkAILimit, checkGeneralLimit, isDailySpendCapExceeded, type LimitResult } from './upstash';

/**
 * Helper for Route Handlers. Returns a 429 (rate limit) or 503 (spend cap)
 * NextResponse when the request should be blocked, otherwise null.
 */
export async function guardAILimit(userId: string): Promise<NextResponse | null> {
  const [limitResult, capExceeded] = await Promise.all([
    checkAILimit(userId),
    isDailySpendCapExceeded(0), // check cap without adding spend yet
  ]);

  if (capExceeded) {
    return new NextResponse(
      JSON.stringify({ error: 'service_unavailable', message: 'Service temporarily unavailable. Please try again later.' }),
      { status: 503, headers: { 'content-type': 'application/json' } }
    );
  }

  return toResponse(limitResult);
}

export async function guardGeneralLimit(identifier: string): Promise<NextResponse | null> {
  return toResponse(await checkGeneralLimit(identifier));
}

function toResponse(r: LimitResult): NextResponse | null {
  if (r.ok) return null;
  const retryAfter = Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000));
  return new NextResponse(
    JSON.stringify({ error: 'rate_limited', retryAfter }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': String(retryAfter),
      },
    }
  );
}
