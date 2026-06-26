import { revalidateTag } from 'next/cache';
import { Webhooks } from '@polar-sh/nextjs';
import { prisma } from '@/lib/db/client';
import { USER_CACHE_TAG } from '@/lib/auth/session';

export const runtime = 'nodejs';

type Metadata = Record<string, string | number | boolean> | undefined;

/**
 * Resolves the DB user from webhook payload metadata or customer email.
 * metadata.userId (set at checkout creation) is authoritative — the customer
 * may have changed their email in the Polar checkout form, so email alone is
 * not reliable.
 */
async function resolveUserId(metadata: Metadata, email?: string): Promise<string | null> {
  const userId = metadata?.userId;
  if (userId && typeof userId === 'string') {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (u) return u.id;
    console.warn('[webhook] metadata.userId not found in DB, falling back to email', { userId });
  }
  if (!email) return null;
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return u?.id ?? null;
}

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
      const sub = (payload as {
        data: {
          id: string;
          customerId: string;
          customer?: { email?: string };
          metadata?: Metadata;
        };
      }).data;

      const userId = await resolveUserId(sub.metadata, sub.customer?.email);
      if (!userId) {
        console.error('[webhook] subscription.active: could not resolve user — Pro not granted', {
          customerId: sub.customerId,
          email: sub.customer?.email,
          metadata: sub.metadata,
        });
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { isPro: true, polarCustomerId: sub.customerId, polarSubscriptionId: sub.id, proSince: new Date() },
      });
      revalidateTag(USER_CACHE_TAG(userId), 'default');
    }

    if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      const sub = (payload as { data: { id: string } }).data;
      const u = await prisma.user.findFirst({
        where: { polarSubscriptionId: sub.id },
        select: { id: true, hasLifetimePlan: true },
      });
      if (!u) return;

      if (!u.hasLifetimePlan) {
        await prisma.user.update({
          where: { id: u.id },
          data: { isPro: false, polarSubscriptionId: null, proExpiresAt: null },
        });
      } else {
        await prisma.user.update({
          where: { id: u.id },
          data: { polarSubscriptionId: null },
        });
      }
      revalidateTag(USER_CACHE_TAG(u.id), 'default');
    }

    if (type === 'order.paid') {
      const order = (payload as {
        data: {
          customerId: string;
          subscriptionId?: string | null;
          customer?: { email?: string };
          metadata?: Metadata;
        };
      }).data;

      // Polar fires order.paid for every payment, including the first charge of a
      // subscription. Only set hasLifetimePlan when there is no subscriptionId —
      // that means it's a one-time lifetime purchase, not a recurring subscription.
      const isLifetime = !order.subscriptionId;

      const userId = await resolveUserId(order.metadata, order.customer?.email);
      if (!userId) {
        console.error('[webhook] order.paid: could not resolve user — Pro not granted', {
          customerId: order.customerId,
          isLifetime,
          email: order.customer?.email,
          metadata: order.metadata,
        });
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isPro: true,
          ...(isLifetime && { hasLifetimePlan: true }),
          polarCustomerId: order.customerId,
          proSince: new Date(),
        },
      });
      revalidateTag(USER_CACHE_TAG(userId), 'default');
    }
  },
});
