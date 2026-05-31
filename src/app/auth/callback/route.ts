import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth/supabase-server';
import { prisma } from '@/lib/db/client';

/**
 * Supabase OAuth callback. Exchanges the `?code` for a session, then redirects
 * to the correct post-login destination.
 *
 * Smart redirect logic:
 *  - If the user has already completed onboarding (targetRole is set) → /dashboard
 *  - If the user is new (no targetRole) → /onboarding
 *  - The `next` param is honoured only for destinations other than /onboarding,
 *    so returning users who clicked "Get started" are never sent back to onboarding.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
  }

  // Determine where to send the user.
  // If `next` is /onboarding (the default CTA destination), we check whether this
  // user has already completed onboarding and redirect to /dashboard instead.
  let destination = next;
  if (next === '/onboarding' && sessionData.user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      select: { targetRole: true },
    });
    // targetRole is set → onboarding already done → go to dashboard
    if (dbUser?.targetRole) {
      destination = '/dashboard';
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
