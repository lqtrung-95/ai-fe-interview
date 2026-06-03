'use server';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { isProUser } from '@/lib/subscription/subscription-service';

export type RedeemResult =
  | { success: true; expiresAt: Date }
  | {
      success: false;
      error:
        | 'invalid_code'
        | 'expired_code'
        | 'exhausted'
        | 'already_redeemed'
        | 'already_pro';
    };

/**
 * Redeems a promo code for the signed-in user.
 * On success, sets isPro=true and proExpiresAt=now+durationDays.
 * Idempotent per (code, user) pair — duplicate submissions return already_redeemed.
 */
export async function redeemPromoCode(rawCode: string): Promise<RedeemResult> {
  const user = await requireUser();

  // Block if already Pro (Polar subscriber or active promo) — prevents stacking
  const alreadyPro = await isProUser(user);
  if (alreadyPro) {
    return { success: false, error: 'already_pro' };
  }

  const code = rawCode.trim().toUpperCase();

  const promoCode = await prisma.promoCode.findUnique({ where: { code } });
  if (!promoCode) return { success: false, error: 'invalid_code' };

  // Check code validity window
  if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
    return { success: false, error: 'expired_code' };
  }

  // Check this user hasn't already redeemed this code
  const existing = await prisma.promoRedemption.findUnique({
    where: { promoCodeId_userId: { promoCodeId: promoCode.id, userId: user.id } },
  });
  if (existing) return { success: false, error: 'already_redeemed' };

  // Atomic: enforce cap + create redemption + grant Pro.
  // usedCount is incremented with a conditional WHERE to prevent TOCTOU over-issuance.
  const grantedAt = new Date();
  const proExpiresAt = new Date(grantedAt);
  proExpiresAt.setDate(proExpiresAt.getDate() + promoCode.durationDays);

  try {
    const [capUpdate] = await prisma.$transaction([
      // Conditionally increment usedCount only if still under the cap (maxUses=0 = unlimited)
      prisma.promoCode.updateMany({
        where: {
          id: promoCode.id,
          ...(promoCode.maxUses > 0 ? { usedCount: { lt: promoCode.maxUses } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.promoRedemption.create({
        data: {
          promoCodeId: promoCode.id,
          userId: user.id,
          grantedAt,
          proExpiresAt,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isPro: true, proExpiresAt, proSince: grantedAt },
      }),
    ]);

    // capUpdate.count === 0 means the code hit maxUses between our pre-check and the transaction
    if (promoCode.maxUses > 0 && capUpdate.count === 0) {
      return { success: false, error: 'exhausted' };
    }
  } catch (err: unknown) {
    // Unique constraint violation = race condition (duplicate redemption attempt)
    if ((err as { code?: string })?.code === 'P2002') {
      return { success: false, error: 'already_redeemed' };
    }
    throw err;
  }

  return { success: true, expiresAt: proExpiresAt };
}
