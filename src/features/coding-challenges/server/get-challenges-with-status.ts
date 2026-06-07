import 'server-only';
import { prisma } from '@/lib/db/client';
import { toPublicChallenge } from '@/lib/coding-challenges/challenge-projection';
import type { ChallengeWithStatus } from '@/features/coding-challenges/types';

export async function getChallengesWithStatus(userId?: string): Promise<ChallengeWithStatus[]> {
  const [challenges, submissions] = await Promise.all([
    prisma.codingChallenge.findMany({
      orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
    }),
    userId
      ? prisma.codingSubmission.findMany({
          where: { userId },
          select: { challengeId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  // Build per-challenge status map
  const solvedIds = new Set<string>();
  const attemptedIds = new Set<string>();
  for (const s of submissions) {
    if (s.status === 'passed') {
      solvedIds.add(s.challengeId);
    } else {
      attemptedIds.add(s.challengeId);
    }
  }

  return challenges.map((ch) => ({
    ...toPublicChallenge(ch),
    userStatus: solvedIds.has(ch.id)
      ? 'solved'
      : attemptedIds.has(ch.id)
        ? 'attempted'
        : 'unsolved',
  }));
}
