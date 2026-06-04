import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createSupabaseServerClient } from './supabase-server';
import { prisma } from '@/lib/db/client';
import type { User as DbUser } from '@prisma/client';

export const USER_CACHE_TAG = (userId: string) => `user-${userId}`;

// Module-level cached DB lookup — arguments are included in the cache key automatically.
// Invalidated via revalidateTag(USER_CACHE_TAG(userId)) after any user mutation.
const getDbUser = unstable_cache(
  async (userId: string, email: string, name: string | null, image: string | null) => {
    return prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email, name, image },
    });
  },
  ['user-db-lookup'],
  { revalidate: 30 },
);

/**
 * Returns the Prisma `User` for the currently signed-in Supabase auth user.
 * Idempotently provisions a User row on first authenticated request — covers
 * the race where the webhook hasn't fired yet (architecture §8 fallback).
 * getUser() validates the token with Supabase Auth (secure); the DB lookup is
 * cached per-user for 30s to avoid a round-trip on every navigation.
 * Cached per-request via React's cache().
 */
export const getCurrentUser = cache(async (): Promise<DbUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { id, email, user_metadata } = authUser;
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
