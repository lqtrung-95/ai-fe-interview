import { type NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { requireUser } from '@/lib/auth/session';

export const runtime = 'nodejs';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_SERVER ?? 'production') as 'production' | 'sandbox',
});

/**
 * GET /api/checkout?products=<productId>
 *
 * Creates a Polar hosted checkout session locked to the signed-in user's email.
 * Using the SDK directly (instead of the @polar-sh/nextjs Checkout helper) lets
 * us pass customerEmail so the webhook reliably matches the Polar customer to the
 * DB user — if emails differ the webhook handler silently finds 0 rows and Pro
 * is never granted.
 */
export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const productIds = req.nextUrl.searchParams.getAll('products').filter(Boolean);
  if (!productIds.length) {
    return NextResponse.json({ error: 'no_products' }, { status: 400 });
  }

  try {
    const checkout = await polar.checkouts.create({
      products: productIds,
      customerEmail: user.email,
      // userId in metadata is the reliable tie between Polar customer and DB user.
      // The webhook uses it as primary lookup so a changed email at checkout doesn't
      // break Pro activation.
      metadata: { userId: user.id },
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success`,
    });
    return NextResponse.redirect(checkout.url);
  } catch (err) {
    console.error('[checkout] Polar SDK error', err);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 });
  }
}
