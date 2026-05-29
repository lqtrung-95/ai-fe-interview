import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { guardAILimit } from '@/lib/rate-limit/guard';
import { generateSummary } from '@/features/feedback/server/summary-service';
import { dashboardCacheTag } from '@/features/dashboard/server/progress-service';

export const runtime = 'nodejs';

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
  const result = await generateSummary(id, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Bust the dashboard cache so the next visit reflects the new session.
  // Next.js 16: revalidateTag requires a second cache-profile argument.
  revalidateTag(dashboardCacheTag(user.id), 'default');

  return NextResponse.json({
    summaryId: result.summary!.id,
    overallScore: result.summary!.overallScore,
    strongAreas: result.summary!.strongAreas,
    weakAreas: result.summary!.weakAreas,
    repeatedMistakes: result.summary!.repeatedMistakes,
    recommendedTopics: result.summary!.recommendedTopics,
    actionItems: result.summary!.actionItems,
  });
}
