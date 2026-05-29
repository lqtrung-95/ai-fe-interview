'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studyPlanKeys } from '@/lib/query/keys';
import { toggleStudiedAction } from '../actions/study-plan-actions';
import type { StudyPlanProgress } from './use-study-plan-progress-query';

/**
 * Optimistic toggle for marking a question as studied/unStudied.
 *
 * Flow:
 *  onMutate  → cancel in-flight refetches, flip studied state immediately
 *  onError   → rollback to previous cache state
 *  onSettled → invalidate so the server truth wins after settle
 */
export function useMarkStudiedMutation(seedQuestionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleStudiedAction(seedQuestionId),

    onMutate: async () => {
      // Prevent racing refetch from overwriting the optimistic value
      await queryClient.cancelQueries({ queryKey: studyPlanKeys.progress() });

      const previous = queryClient.getQueryData<StudyPlanProgress>(studyPlanKeys.progress());

      queryClient.setQueryData<StudyPlanProgress>(studyPlanKeys.progress(), (old) => {
        if (!old) return old;
        const wasStudied = old.studiedIds.includes(seedQuestionId);
        return {
          ...old,
          studiedIds: wasStudied
            ? old.studiedIds.filter((id) => id !== seedQuestionId)
            : [...old.studiedIds, seedQuestionId],
        };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Rollback to the snapshot captured in onMutate
      if (context?.previous !== undefined) {
        queryClient.setQueryData(studyPlanKeys.progress(), context.previous);
      }
    },

    onSettled: () => {
      // Always re-sync with server truth after the mutation resolves
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.progress() });
    },
  });
}
