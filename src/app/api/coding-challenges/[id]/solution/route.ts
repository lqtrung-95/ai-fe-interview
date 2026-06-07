import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

// Solution is freely available — this is a learning tool, not a competition.
// The button click is the friction that encourages trying first.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await prisma.codingChallenge.findUnique({
    where: { id },
    select: { solution: true },
  });
  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ solution: challenge.solution });
}
