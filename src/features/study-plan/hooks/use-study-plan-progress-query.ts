'use client';

import { useQuery } from '@tanstack/react-query';
import { studyPlanKeys } from '@/lib/query/keys';

export interface StudyPlanProgress {
  hasPlan: boolean;
  studiedIds: string[];
}

async function fetchStudyPlanProgress(): Promise<StudyPlanProgress> {
  const res = await fetch('/api/study-plan/progress');
  if (!res.ok) throw new Error('Failed to fetch study plan progress');
  return res.json() as Promise<StudyPlanProgress>;
}

/**
 * Client cache for study-plan progress (hasPlan + studiedIds array).
 *
 * Pass `initialData` from SSR props to seed the cache and avoid a loading
 * flash on first render. staleTime: 0 means it will background-revalidate
 * on mount, keeping client truth in sync with server truth.
 */
export function useStudyPlanProgressQuery(initialData?: StudyPlanProgress) {
  return useQuery({
    queryKey: studyPlanKeys.progress(),
    queryFn: fetchStudyPlanProgress,
    staleTime: 0,
    initialData,
  });
}
