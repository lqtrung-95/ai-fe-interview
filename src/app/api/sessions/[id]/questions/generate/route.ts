import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { streamNextQuestion } from '@/features/interview/server/question-stream-service';
import { guardAILimit } from '@/lib/rate-limit/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;
  const session = await prisma.interviewSession.findFirst({
    where: { id, userId: user.id },
  });
  if (!session) return new NextResponse('Not found', { status: 404 });
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'session_not_active' }, { status: 409 });
  }

  const limited = await guardAILimit(user.id);
  if (limited) return limited;

  try {
    return streamNextQuestion({ user, session });
  } catch (err) {
    console.error('[questions.generate] failed:', err);
    return NextResponse.json(
      {
        error: 'generation_failed',
        message: 'The AI is having trouble. Try again in a moment.',
      },
      { status: 502 }
    );
  }
}
