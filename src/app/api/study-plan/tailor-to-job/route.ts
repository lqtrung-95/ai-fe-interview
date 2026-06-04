import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { tailorToJob } from '@/features/study-plan/lib/job-tailoring';
import type { JdContext } from '@/features/target-jobs/target-job-types';

const bodySchema = z.object({ jobId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.isPro) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const job = await prisma.targetJob.findFirst({
    where: { id: parsed.data.jobId, userId: user.id },
    select: { jdContext: true, label: true },
  });

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (!job.jdContext) return NextResponse.json({ error: 'No context extracted for this job yet' }, { status: 422 });

  const result = tailorToJob(job.jdContext as unknown as JdContext, user.level);
  return NextResponse.json(result);
}
