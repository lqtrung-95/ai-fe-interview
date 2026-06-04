'use client';

import { useMutation } from '@tanstack/react-query';
import type { TailoredPlan } from '../lib/job-tailoring';

async function tailorToJob(jobId: string): Promise<TailoredPlan> {
  const res = await fetch('/api/study-plan/tailor-to-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to tailor plan');
  }
  return res.json();
}

export function useTailorToJobMutation() {
  return useMutation({ mutationFn: tailorToJob });
}
