import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Next.js 16 proxy (formerly middleware.ts) — refreshes the Supabase session
 * cookie on every request so Server Components see a fresh auth state.
 * Runs on the Node.js runtime.
 */
export default async function proxy(request: NextRequest) {
  // Forward pathname so Server Components can read it without accessing the
  // request object directly (which isn't available in RSC).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session if expired. Does not redirect — auth gating happens
  // in (app) layout via getCurrentUser().
  // getClaims() verifies the JWT locally against the project's public signing
  // keys (cached JWKS) instead of a network round-trip per request; it only
  // hits the Auth server to refresh an expired token or on legacy HS256 keys.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Skip static assets, image optimizer, and favicon.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
