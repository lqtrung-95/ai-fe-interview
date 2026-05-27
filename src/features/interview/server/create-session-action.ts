'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { createSessionSchema, type CreateSessionInput } from '../session-config-schema';

export type CreateResult =
  | { ok: true; sessionId: string }
  | { ok: false; message: string };

export async function createSession(input: CreateSessionInput): Promise<CreateResult> {
  const user = await requireUser();
  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      mode: parsed.data.mode,
      difficulty: parsed.data.difficulty,
      topics: parsed.data.topics,
    },
    select: { id: true },
  });

  redirect(`/practice/${session.id}`);
}
