import 'server-only';
import { prisma } from '@/lib/db/client';

const FREE_DAILY_SESSION_LIMIT = 1;

type ProUser = { id: string; isPro: boolean; proExpiresAt: Date | null };

/**
 * Returns true when the user has active Pro access.
 * For promo-granted users (proExpiresAt set), checks expiry and lazily revokes
 * if expired — no cron required.
 */
export async function isProUser(user: ProUser): Promise<boolean> {
  if (!user.isPro) return false;
  // Permanent subscriber (Polar) — no expiry date stored
  if (!user.proExpiresAt) return true;
  // Promo grant — still within the access window
  if (user.proExpiresAt > new Date()) return true;
  // Expired promo: revoke asynchronously so it doesn't block the current request
  prisma.user
    .update({ where: { id: user.id }, data: { isPro: false } })
    .catch((err) => console.error('[subscription] lazy-revoke failed for user', user.id, err));
  return false;
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
export async function hasDailyLimitReached(user: ProUser): Promise<boolean> {
  if (await isProUser(user)) return false;
  const count = await getDailySessionCount(user.id);
  return count >= FREE_DAILY_SESSION_LIMIT;
}
