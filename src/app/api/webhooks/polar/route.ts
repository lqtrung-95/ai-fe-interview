import { revalidateTag } from 'next/cache';
import { Webhooks } from '@polar-sh/nextjs';
import { prisma } from '@/lib/db/client';
import { USER_CACHE_TAG } from '@/lib/auth/session';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/polar
 *
 * Polar sends signed events here. The Webhooks helper verifies the signature
 * via POLAR_WEBHOOK_SECRET before invoking onPayload — no raw HTTP calls.
 *
 * Handled events:
 *   subscription.active   → grant Pro
 *   subscription.canceled → revoke subscription Pro (lifetime holders keep access)
 *   subscription.revoked  → revoke subscription Pro (lifetime holders keep access)
 *   order.paid            → grant Pro (one-time lifetime purchase)
 */
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onPayload: async (payload) => {
    const type = payload.type;

    if (type === 'subscription.active') {
      const sub = (payload as { data: { id: string; customerId: string; customer?: { email?: string } } }).data;
      if (!sub.customer?.email) {
        console.warn('[webhook] subscription.active missing customer email — skipping', { customerId: sub.customerId });
        return;
      }
      const updated = await prisma.user.updateMany({
        where: { email: sub.customer.email },
        data: { isPro: true, polarCustomerId: sub.customerId, polarSubscriptionId: sub.id, proSince: new Date() },
      });
      if (updated.count === 0) {
        console.error('[webhook] subscription.active: no user matched email — Pro not granted', {
          email: sub.customer.email,
          customerId: sub.customerId,
          subscriptionId: sub.id,
        });
        return;
      }
      const u = await prisma.user.findUnique({ where: { email: sub.customer.email }, select: { id: true } });
      if (u) revalidateTag(USER_CACHE_TAG(u.id), 'default');
    }

    if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      const sub = (payload as { data: { id: string } }).data;
      // Find the user by subscription ID first so we can check for lifetime access.
      const u = await prisma.user.findFirst({
        where: { polarSubscriptionId: sub.id },
        select: { id: true, hasLifetimePlan: true },
      });
      if (!u) return;

      // Lifetime holders keep Pro access even if they once had a subscription canceled.
      if (!u.hasLifetimePlan) {
        await prisma.user.update({
          where: { id: u.id },
          data: { isPro: false, polarSubscriptionId: null, proExpiresAt: null },
        });
      } else {
        // Clear the stale subscription reference but preserve Pro.
        await prisma.user.update({
          where: { id: u.id },
          data: { polarSubscriptionId: null },
        });
      }
      revalidateTag(USER_CACHE_TAG(u.id), 'default');
    }

    // One-time purchase (lifetime deal)
    if (type === 'order.paid') {
      const order = (payload as { data: { customerId: string; customer?: { email?: string } } }).data;
      if (!order.customer?.email) {
        console.warn('[webhook] order.paid missing customer email — skipping', { customerId: order.customerId });
        return;
      }
      const updated = await prisma.user.updateMany({
        where: { email: order.customer.email },
        data: { isPro: true, hasLifetimePlan: true, polarCustomerId: order.customerId, proSince: new Date() },
      });
      if (updated.count === 0) {
        console.error('[webhook] order.paid: no user matched email — lifetime Pro not granted', {
          email: order.customer.email,
          customerId: order.customerId,
        });
        return;
      }
      const u = await prisma.user.findUnique({ where: { email: order.customer.email }, select: { id: true } });
      if (u) revalidateTag(USER_CACHE_TAG(u.id), 'default');
    }
  },
});
