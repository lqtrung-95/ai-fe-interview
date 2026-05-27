import 'server-only';
import { cache } from 'react';
import { createSupabaseServerClient } from './supabase-server';
import { prisma } from '@/lib/db/client';
import type { User as DbUser } from '@prisma/client';

/**
 * Returns the Prisma `User` for the currently signed-in Supabase auth user.
 * Idempotently provisions a User row on first authenticated request — covers
 * the race where the webhook hasn't fired yet (architecture §8 fallback).
 * Cached per-request via React's `cache()`.
 */
export const getCurrentUser = cache(async (): Promise<DbUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: {},
    create: {
      id: authUser.id,
      email: authUser.email ?? '',
      name:
        (authUser.user_metadata?.full_name as string | undefined) ??
        (authUser.user_metadata?.name as string | undefined) ??
        null,
      image: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
    },
  });
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
