import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { toPublicChallenge, toPublicComponentChallenge } from '@/lib/coding-challenges/challenge-projection';
import { ChallengeWorkspace } from '@/features/coding-challenges/challenge-workspace';
import { ComponentChallengeWorkspace } from '@/features/coding-challenges/component-challenge-workspace';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const ch = await prisma.codingChallenge.findUnique({ where: { id }, select: { title: true } });
  return { title: ch?.title ?? 'Challenge' };
}

export default async function ChallengePage({ params }: PageProps) {
  const { id } = await params;
  const [challenge, user] = await Promise.all([
    prisma.codingChallenge.findUnique({ where: { id } }),
    getCurrentUser(),
  ]);

  if (!challenge) notFound();

  if (challenge.kind === 'component') {
    return (
      <ComponentChallengeWorkspace
        challenge={toPublicComponentChallenge(challenge)}
        isAuthenticated={!!user}
        isPro={user?.isPro ?? false}
      />
    );
  }

  return (
    <ChallengeWorkspace
      challenge={toPublicChallenge(challenge)}
      isAuthenticated={!!user}
      isPro={user?.isPro ?? false}
    />
  );
}
