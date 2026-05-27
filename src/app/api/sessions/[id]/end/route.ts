import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { guardGeneralLimit } from '@/lib/rate-limit/guard';
import { endSession } from '@/features/interview/server/session-service';

export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const limited = await guardGeneralLimit(user.id);
  if (limited) return limited;

  const { id } = await ctx.params;
  const result = await endSession({ sessionId: id, userId: user.id });
  if (result === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ status: 'ended_early' });
}
