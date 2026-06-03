'use server';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { hasDailyLimitReached } from '@/lib/subscription/subscription-service';
import { createSessionSchema, type CreateSessionInput } from '../session-config-schema';

export type CreateResult =
  | { ok: true; sessionId: string }
  | { ok: false; message: string; code?: string };

/**
 * Creates an interview session and returns the sessionId.
 * Redirect is handled client-side so the form can append ?timer=N.
 * Free users are limited to 1 session per calendar day (UTC).
 */
export async function createSession(input: CreateSessionInput): Promise<CreateResult> {
  const user = await requireUser();
  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  if (await hasDailyLimitReached(user)) {
    return { ok: false, message: 'daily_limit_reached', code: 'daily_limit_reached' };
  }

  // Resolve target job label for Pro users
  let label: string | undefined;
  let targetJobId: string | undefined;
  if (parsed.data.targetJobId) {
    if (!user.isPro) {
      return { ok: false, message: 'Pro required for job targeting', code: 'not_pro' };
    }
    const job = await prisma.targetJob.findFirst({
      where: { id: parsed.data.targetJobId, userId: user.id },
      select: { label: true },
    });
    if (job) {
      label = job.label;
      targetJobId = parsed.data.targetJobId;
    }
  }

  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      mode: parsed.data.mode,
      difficulty: parsed.data.difficulty,
      topics: parsed.data.topics,
      usesCv: parsed.data.usesCv ?? false,
      label,
      targetJobId,
    },
    select: { id: true },
  });

  return { ok: true, sessionId: session.id };
}
