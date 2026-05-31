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

  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      mode: parsed.data.mode,
      difficulty: parsed.data.difficulty,
      topics: parsed.data.topics,
      usesCv: parsed.data.usesCv ?? false,
    },
    select: { id: true },
  });

  return { ok: true, sessionId: session.id };
}
