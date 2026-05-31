import { Webhooks } from '@polar-sh/nextjs';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/polar
 *
 * Polar sends signed events here. The Webhooks helper verifies the signature
 * via POLAR_WEBHOOK_SECRET before invoking onPayload — no raw HTTP calls.
 *
 * Handled events:
 *   subscription.active   → grant Pro
 *   subscription.canceled → revoke Pro
 *   subscription.revoked  → revoke Pro
 *   order.paid            → grant Pro (one-time purchase)
 */
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onPayload: async (payload) => {
    const type = payload.type;

    if (type === 'subscription.active') {
      const sub = (payload as { data: { id: string; customerId: string; customer?: { email?: string } } }).data;
      if (!sub.customer?.email) return;
      await prisma.user.updateMany({
        where: { email: sub.customer.email },
        data: {
          isPro: true,
          polarCustomerId: sub.customerId,
          polarSubscriptionId: sub.id,
          proSince: new Date(),
        },
      });
    }

    if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      const sub = (payload as { data: { id: string } }).data;
      await prisma.user.updateMany({
        where: { polarSubscriptionId: sub.id },
        data: { isPro: false },
      });
    }

    // One-time purchase (lifetime deal)
    if (type === 'order.paid') {
      const order = (payload as { data: { customerId: string; customer?: { email?: string } } }).data;
      if (!order.customer?.email) return;
      await prisma.user.updateMany({
        where: { email: order.customer.email },
        data: {
          isPro: true,
          polarCustomerId: order.customerId,
          proSince: new Date(),
        },
      });
    }
  },
});
