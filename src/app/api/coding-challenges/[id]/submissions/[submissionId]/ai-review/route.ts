import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { streamCodeReview } from '@/lib/ai/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 30;

type Params = { params: Promise<{ id: string; submissionId: string }> };

export async function POST(_req: Request, { params }: Params) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  if (!user.isPro) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }

  const { id: challengeId, submissionId } = await params;

  const submission = await prisma.codingSubmission.findFirst({
    where: { id: submissionId, userId: user.id, challengeId },
    include: { challenge: { select: { title: true, description: true } } },
  });

  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (submission.status !== 'passed') {
    return NextResponse.json(
      { error: 'not_passing', message: 'AI review is only available for fully passing submissions.' },
      { status: 400 }
    );
  }

  // Return cached review if already generated
  if (submission.aiReview) {
    return new Response(submission.aiReview, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const result = streamCodeReview(
    {
      challengeTitle: submission.challenge.title,
      challengeDescription: submission.challenge.description,
      userCode: submission.code,
      testsPassed: `${submission.passedCount} / ${submission.totalCount}`,
    },
    {
      userId: user.id,
      onFinish: async (text) => {
        await prisma.codingSubmission.update({
          where: { id: submissionId },
          data: { aiReview: text },
        });
      },
    }
  );

  return result.toTextStreamResponse();
}
