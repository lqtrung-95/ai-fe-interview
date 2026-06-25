import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { runAITask } from '@/lib/ai/orchestrator';
import { sanitize } from '@/lib/ai/sanitize';
import { prisma } from '@/lib/db/client';
import { guardAILimit, guardGeneralLimit } from '@/lib/rate-limit/guard';

export const runtime = 'nodejs';

const bodySchema = z
  .object({
    followUpAnswer: z.string().min(1).max(8000).optional(),
    // The follow-up question being answered (so the saved transcript keeps Q+A).
    followUpQuestion: z.string().max(2000).optional(),
  })
  .optional();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;
  const parsed = await parseBody(req);
  if (!parsed.success) return parsed.response;

  if (parsed.data?.followUpAnswer) {
    const limited = await guardGeneralLimit(user.id);
    if (limited) return limited;
    return saveFollowUpAnswer(id, user.id, parsed.data.followUpAnswer, parsed.data.followUpQuestion);
  }

  const limited = await guardAILimit(user.id);
  if (limited) return limited;
  return generateFollowUp(id, user.id, user.isPro);
}

async function generateFollowUp(answerId: string, userId: string, isPro: boolean) {
  const answer = await prisma.userAnswer.findFirst({
    where: { id: answerId, userId },
    include: { question: { select: { question: true, difficulty: true } } },
  });
  if (!answer) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  try {
    const result = await runAITask(
      {
        type: 'generate_followup',
        input: {
          question: answer.question.question,
          userAnswer: answer.answer,
          difficulty: answer.question.difficulty,
          // Accumulated follow-up turns so far → drives the deeper drill.
          priorFollowups: answer.followUpAnswer ?? undefined,
        },
      },
      { userId, sessionId: answer.sessionId, isPro }
    );
    return NextResponse.json({ followUp: result.followUp });
  } catch (err) {
    console.error('[answers.followup] failed:', err);
    return NextResponse.json(
      { error: 'generation_failed', message: 'Could not generate a follow-up right now.' },
      { status: 502 }
    );
  }
}

async function saveFollowUpAnswer(
  answerId: string,
  userId: string,
  followUpAnswer: string,
  followUpQuestion?: string,
) {
  const answer = await prisma.userAnswer.findFirst({
    where: { id: answerId, userId },
    select: { id: true, followUpAnswer: true },
  });
  if (!answer) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Append this turn to the running transcript so multi-turn drilling is kept.
  // When the question is provided we store "Q:/A:"; otherwise just the answer
  // (legacy single-follow-up shape).
  const turn = followUpQuestion
    ? `Q: ${sanitize(followUpQuestion, 1000)}\nA: ${sanitize(followUpAnswer, 4000)}`
    : sanitize(followUpAnswer, 4000);
  const combined = answer.followUpAnswer ? `${answer.followUpAnswer}\n\n${turn}` : turn;

  await prisma.userAnswer.update({
    where: { id: answer.id },
    data: { followUpAnswer: combined },
  });
  return NextResponse.json({ status: 'submitted' });
}

async function parseBody(req: Request): Promise<
  | { success: true; data: z.infer<typeof bodySchema> }
  | { success: false; response: Response }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = undefined;
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'invalid_body', issues: parsed.error.issues },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: parsed.data };
}
