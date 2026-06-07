import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { toPublicChallenge } from '@/lib/coding-challenges/challenge-projection';

export const runtime = 'nodejs';

export async function GET() {
  const challenges = await prisma.codingChallenge.findMany({
    orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
  });

  return NextResponse.json(challenges.map(toPublicChallenge));
}
