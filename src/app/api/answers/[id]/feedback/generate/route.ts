import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { guardAILimit } from '@/lib/rate-limit/guard';
import { streamFeedback } from '@/features/feedback/server/feedback-service';

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

  const limited = await guardAILimit(user.id);
  if (limited) return limited;

  const { id } = await ctx.params;
  try {
    return streamFeedback(id, user.id);
  } catch (err) {
    console.error('[answers.feedback.generate] failed:', err);
    return NextResponse.json(
      { error: 'generation_failed', message: 'Could not generate feedback right now.' },
      { status: 502 }
    );
  }
}
