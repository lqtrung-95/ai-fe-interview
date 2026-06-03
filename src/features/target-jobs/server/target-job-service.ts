import 'server-only';
import { prisma } from '@/lib/db/client';
import { runAITask } from '@/lib/ai/orchestrator';
import type { JdContext } from '../target-job-types';

const MAX_TARGET_JOBS = 3;

export type TargetJobResult =
  | { ok: true; targetJob: { id: string; label: string; jdContext: JdContext | null } }
  | { ok: false; code: 'not_pro' | 'limit_reached' | 'extraction_failed' | 'not_found'; message: string };

export async function listTargetJobs(userId: string) {
  return prisma.targetJob.findMany({
    where: { userId },
    select: { id: true, label: true, jdContext: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTargetJob(args: {
  userId: string;
  isPro: boolean;
  label: string;
  rawJd: string;
}): Promise<TargetJobResult> {
  if (!args.isPro) {
    return { ok: false, code: 'not_pro', message: 'Job targeting is a Pro feature.' };
  }

  const count = await prisma.targetJob.count({ where: { userId: args.userId } });
  if (count >= MAX_TARGET_JOBS) {
    return { ok: false, code: 'limit_reached', message: `You can save up to ${MAX_TARGET_JOBS} job targets.` };
  }

  let jdContext: JdContext | null = null;
  try {
    jdContext = await runAITask(
      { type: 'extract_jd', input: { rawJd: args.rawJd.slice(0, 8000) } },
      { userId: args.userId }
    );
  } catch {
    // Non-fatal: save the target job without extracted context rather than failing entirely
    jdContext = null;
  }

  const targetJob = await prisma.targetJob.create({
    data: {
      userId: args.userId,
      label: args.label.trim(),
      rawJd: args.rawJd,
      jdContext: jdContext ? (jdContext as unknown as import('@prisma/client').Prisma.InputJsonValue) : undefined,
    },
    select: { id: true, label: true, jdContext: true },
  });

  return { ok: true, targetJob: { ...targetJob, jdContext: targetJob.jdContext as JdContext | null } };
}

export async function deleteTargetJob(args: {
  userId: string;
  id: string;
}): Promise<{ ok: true } | { ok: false; code: 'not_found' }> {
  const job = await prisma.targetJob.findFirst({
    where: { id: args.id, userId: args.userId },
    select: { id: true },
  });
  if (!job) return { ok: false, code: 'not_found' };

  await prisma.targetJob.delete({ where: { id: args.id } });
  return { ok: true };
}
