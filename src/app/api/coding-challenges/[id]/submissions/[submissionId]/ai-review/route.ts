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
    include: { challenge: { select: { title: true, description: true, kind: true } } },
  });

  if (!submission) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const isComponent = submission.challenge.kind === 'component';

  // Function challenges gate the review on a passing run. Component challenges
  // are always reviewable — critiquing a11y issues is the whole point.
  if (!isComponent && submission.status !== 'passed') {
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
      ...(isComponent
        ? { kind: 'component' as const, a11yFindings: formatA11yFindings(submission.testResults) }
        : {}),
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

/** Formats the persisted axe-core signals into a readable block for the prompt. */
function formatA11yFindings(testResults: unknown): string {
  const signals = testResults as {
    status?: string;
    renderError?: string;
    violations?: { id: string; impact: string | null; help: string; nodes: number }[];
  } | null;
  if (!signals) return 'No accessibility signals were captured.';
  if (signals.status && signals.status !== 'ok') {
    return `The component did not render (${signals.status}): ${signals.renderError ?? 'unknown error'}.`;
  }
  const violations = signals.violations ?? [];
  if (violations.length === 0) return 'No automated accessibility violations were detected.';
  return violations
    .map((v) => `- [${v.impact ?? 'info'}] ${v.help} (${v.id}) — ${v.nodes} element(s)`)
    .join('\n');
}
