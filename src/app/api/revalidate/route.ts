import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * POST /api/revalidate — busts the 'seed-questions' unstable_cache tag so
 * fresh seed content appears immediately instead of waiting out the 1h TTL.
 * Called by prisma/seed.ts after a successful re-seed.
 *
 * Auth: shared secret in the x-revalidate-secret header (REVALIDATE_SECRET
 * env). Returns 503 when the secret isn't configured — the endpoint is then
 * effectively disabled rather than open.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'revalidation not configured' }, { status: 503 });
  }
  if (req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Next 16 signature: second arg is a cache-life profile. 'max' marks the
  // tag stale immediately and refreshes it in the background (SWR semantics).
  revalidateTag('seed-questions', 'max');
  return NextResponse.json({ revalidated: true, tag: 'seed-questions' });
}
