import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createSupabaseServerClient } from './supabase-server';
import { prisma } from '@/lib/db/client';
import type { User as DbUser } from '@prisma/client';

export const USER_CACHE_TAG = (userId: string) => `user-${userId}`;

// Cached DB lookup keyed by userId — avoids a DB round-trip on every navigation.
// Invalidated via revalidateTag(USER_CACHE_TAG(userId)) after any user mutation.
const getDbUser = (userId: string, email: string, name: string | null, image: string | null) =>
  unstable_cache(
    () =>
      prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, email, name, image },
      }),
    [USER_CACHE_TAG(userId)],
    { revalidate: 30, tags: [USER_CACHE_TAG(userId)] },
  )();

/**
 * Returns the Prisma `User` for the currently signed-in Supabase auth user.
 * Uses getSession() (cookie read, no network call) since proxy.ts already
 * validates and refreshes the session on every request via getUser().
 * Cached per-request via React's cache().
 */
export const getCurrentUser = cache(async (): Promise<DbUser | null> => {
  const supabase = await createSupabaseServerClient();
  // proxy.ts (middleware) calls getUser() on every request — session is already
  // validated and refreshed before this runs. getSession() reads from the cookie.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { id, email, user_metadata } = session.user;
  return getDbUser(
    id,
    email ?? '',
    ((user_metadata?.full_name as string | undefined) ?? (user_metadata?.name as string | undefined)) ?? null,
    (user_metadata?.avatar_url as string | undefined) ?? null,
  );
});

/**
 * Throws if no signed-in user. Use in Route Handlers / Server Actions.
 */
export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return user;
}
