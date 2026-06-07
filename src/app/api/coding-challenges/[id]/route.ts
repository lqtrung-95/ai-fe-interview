import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { toPublicChallenge } from '@/lib/coding-challenges/challenge-projection';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await prisma.codingChallenge.findUnique({ where: { id } });
  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(toPublicChallenge(challenge));
}
