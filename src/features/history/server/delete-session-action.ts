'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

/**
 * Deletes an in-progress session that belongs to the current user.
 * Cascades to questions, answers, and feedback via schema-level onDelete.
 */
export async function deleteSessionAction(sessionId: string): Promise<void> {
  const user = await requireUser();
  // deleteMany is safe: silently no-ops if the session doesn't exist or
  // belongs to a different user (no 404 throw needed here).
  await prisma.interviewSession.deleteMany({
    where: { id: sessionId, userId: user.id },
  });
  revalidatePath('/history');
}
