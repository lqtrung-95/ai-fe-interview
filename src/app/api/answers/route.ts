import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { guardGeneralLimit } from '@/lib/rate-limit/guard';
import { sanitize } from '@/lib/ai/sanitize';

export const runtime = 'nodejs';

const bodySchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(8000),
  followUpAnswer: z.string().max(8000).optional(),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const limited = await guardGeneralLimit(user.id);
  if (limited) return limited;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Verify ownership: the question must belong to a session owned by the user.
  const question = await prisma.interviewQuestion.findFirst({
    where: { id: parsed.data.questionId, session: { userId: user.id } },
    select: { id: true, sessionId: true, answer: { select: { id: true } } },
  });
  if (!question) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (question.answer) {
    return NextResponse.json(
      { error: 'already_answered', answerId: question.answer.id },
      { status: 409 }
    );
  }

  // Persist answer BEFORE any AI call (PRD §11.2 reliability).
  const answer = await prisma.userAnswer.create({
    data: {
      questionId: question.id,
      sessionId: question.sessionId,
      userId: user.id,
      answer: sanitize(parsed.data.answer, 6000),
      followUpAnswer: parsed.data.followUpAnswer
        ? sanitize(parsed.data.followUpAnswer, 4000)
        : null,
    },
    select: { id: true },
  });

  return NextResponse.json({ answerId: answer.id, status: 'submitted' });
}
