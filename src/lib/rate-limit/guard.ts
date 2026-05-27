import 'server-only';
import { NextResponse } from 'next/server';
import { checkAILimit, checkGeneralLimit, type LimitResult } from './upstash';

/**
 * Helper for Route Handlers. Returns a 429 NextResponse if the limit was hit,
 * otherwise null (caller proceeds).
 */
export async function guardAILimit(userId: string): Promise<NextResponse | null> {
  return toResponse(await checkAILimit(userId));
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
