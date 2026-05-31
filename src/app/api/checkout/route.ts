import { type NextRequest } from 'next/server';
import { Checkout } from '@polar-sh/nextjs';
import { requireUser } from '@/lib/auth/session';

export const runtime = 'nodejs';

/**
 * GET /api/checkout?products=<productId>
 *
 * Auth-gates checkout so we can tie the Polar customer to the logged-in user.
 * The Checkout helper from @polar-sh/nextjs reads ?products= from the query
 * string, creates a Polar hosted checkout session, and redirects there.
 *
 * Env vars required:
 *   POLAR_ACCESS_TOKEN   — server-side Polar API token
 *   NEXT_PUBLIC_APP_URL  — canonical origin (e.g. https://app.example.com)
 */

const polarCheckout = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success`,
  server: (process.env.POLAR_SERVER ?? 'production') as 'production' | 'sandbox',
});

export async function GET(req: NextRequest) {
  // Verify the user is signed in before creating a checkout session.
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  // Delegate to the Polar Next.js checkout handler (reads ?products= query param).
  return polarCheckout(req);
}
