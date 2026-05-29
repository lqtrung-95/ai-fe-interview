'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studyPlanKeys } from '@/lib/query/keys';
import { savePlanAction } from '../actions/study-plan-actions';

/**
 * Wraps the `savePlanAction` server action.
 * On success, invalidates all study-plan cache entries so progress
 * queries re-fetch with the new plan configuration.
 */
export function useSavePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => savePlanAction(formData),
    onSuccess: () => {
      // Plan change affects studied counts, topic lists, progress — bust all sub-keys
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.all() });
    },
  });
}
