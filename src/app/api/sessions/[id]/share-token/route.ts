import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getOrCreateShareToken } from '@/features/feedback/server/share-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;
  const token = await getOrCreateShareToken(id, user.id);
  if (!token) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({ token });
}
