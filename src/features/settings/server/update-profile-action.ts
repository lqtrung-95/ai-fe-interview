'use server';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

interface UpdateProfileInput {
  name: string;
  avatarUrl?: string | null;
}

/**
 * Updates the user's display name and optionally their avatar URL.
 * The avatar file itself is uploaded client-side to Supabase Storage;
 * this action only persists the resulting public URL to the DB.
 *
 * Note: does NOT call revalidatePath — the client calls router.refresh()
 * after this action so the re-render happens in the normal browser request
 * context (with Supabase session cookies intact), avoiding layout redirect
 * issues that occur when revalidatePath triggers a server-side re-render
 * without the cookie context.
 */
export async function updateProfileAction(input: UpdateProfileInput): Promise<void> {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: input.name.trim() || null,
      ...(input.avatarUrl !== undefined ? { image: input.avatarUrl } : {}),
    },
  });
}
