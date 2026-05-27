'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { onboardingSchema, type OnboardingInput } from './schema';

export type SaveResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

export async function saveOnboarding(input: OnboardingInput): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      level: parsed.data.level,
      targetRole: parsed.data.targetRole,
      targetCompanyType: parsed.data.targetCompanyType,
      preferredTopics: parsed.data.preferredTopics,
    },
  });

  redirect('/practice/new');
}
