import 'server-only';
import { prisma } from '@/lib/db/client';

export async function getCodingChallengesStats(userId: string): Promise<{ solved: number; total: number }> {
  const [solvedGroups, total] = await Promise.all([
    prisma.codingSubmission.findMany({
      where: { userId, status: 'passed' },
      select: { challengeId: true },
      distinct: ['challengeId'],
    }),
    prisma.codingChallenge.count(),
  ]);

  return { solved: solvedGroups.length, total };
}
