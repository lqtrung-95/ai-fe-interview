'use server';

import { revalidateTag } from 'next/cache';
import { requireUser, USER_CACHE_TAG } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

const ALLOWED_GOALS = [3, 5, 10] as const;

/** Sets the user's daily review goal (reviews/day). Clamped to allowed presets. */
export async function updateDailyGoalAction(goal: number): Promise<void> {
  const user = await requireUser();
  const dailyGoal = ALLOWED_GOALS.includes(goal as (typeof ALLOWED_GOALS)[number]) ? goal : 3;

  await prisma.user.update({
    where: { id: user.id },
    data: { dailyGoal },
  });

  revalidateTag(USER_CACHE_TAG(user.id), 'default');
}
