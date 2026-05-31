import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { deleteCvFile } from '@/lib/cv/cv-storage';

/**
 * DELETE /api/cv/delete
 *
 * Removes the user's CV file from Supabase Storage and clears
 * cvData, cvFileUrl, cvParsedAt from their User record.
 */
export async function DELETE() {
  const user = await requireUser();

  // Fetch current file path before clearing
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { cvFileUrl: true },
  });

  // Remove from Storage if a file exists
  if (dbUser?.cvFileUrl) {
    try {
      await deleteCvFile(dbUser.cvFileUrl);
    } catch (err) {
      // Log but don't block — DB clear should still proceed
      console.error('[cv/delete] Storage removal failed:', err instanceof Error ? err.message : err);
    }
  }

  // Clear CV fields from User record
  await prisma.user.update({
    where: { id: user.id },
    // Prisma requires Prisma.DbNull (not plain null) for nullable JSON columns
    data: { cvData: Prisma.DbNull, cvFileUrl: null, cvParsedAt: null },
  });

  return NextResponse.json({ ok: true });
}
