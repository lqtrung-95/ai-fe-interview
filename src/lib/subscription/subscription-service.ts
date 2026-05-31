import 'server-only';
import { prisma } from '@/lib/db/client';

const FREE_DAILY_SESSION_LIMIT = 1;

/** Returns true when the user has an active Pro subscription. */
export function isProUser(user: { isPro: boolean }): boolean {
  return user.isPro;
}

/**
 * Counts how many sessions the user has started since midnight UTC today.
 * Used to enforce the free-tier daily cap.
 */
export async function getDailySessionCount(userId: string): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  return prisma.interviewSession.count({
    where: { userId, startedAt: { gte: startOfToday } },
  });
}

/**
 * Returns true when the free user has hit their daily session cap.
 * Pro users are never blocked.
 */
export async function hasDailyLimitReached(user: { id: string; isPro: boolean }): Promise<boolean> {
  if (user.isPro) return false;
  const count = await getDailySessionCount(user.id);
  return count >= FREE_DAILY_SESSION_LIMIT;
}
