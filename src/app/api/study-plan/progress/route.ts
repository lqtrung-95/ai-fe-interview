import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getStudyPlanStatus } from '@/features/study-plan/server/study-plan-service';

/** Lightweight read endpoint for the TanStack Query client cache. */
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const { hasPlan, studiedIds } = await getStudyPlanStatus(user.id);
  return NextResponse.json({
    hasPlan,
    studiedIds: [...studiedIds],   // Set → Array for JSON serialisation
  });
}
