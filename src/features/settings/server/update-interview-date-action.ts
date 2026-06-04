'use server';

import { revalidateTag } from 'next/cache';
import { requireUser, USER_CACHE_TAG } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

/**
 * Sets or clears the user's target interview date.
 * Passing null clears the countdown from the dashboard.
 */
export async function updateInterviewDateAction(dateIso: string | null): Promise<void> {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { targetInterviewDate: dateIso ? new Date(dateIso) : null },
  });

  revalidateTag(USER_CACHE_TAG(user.id), 'default');
}
