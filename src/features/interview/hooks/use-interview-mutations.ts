'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/query/keys';
import {
  completeInterviewSession,
  endInterviewSession,
  generateFollowUp,
  saveFollowUpAnswer,
  submitPrimaryAnswer,
} from '../answer-flow-client';

/** Submit a primary answer → returns answerId */
export function useSubmitAnswerMutation() {
  return useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
      submitPrimaryAnswer(questionId, answer),
  });
}

/** Generate a follow-up question for a given answer */
export function useGenerateFollowUpMutation() {
  return useMutation({
    mutationFn: (answerId: string) => generateFollowUp(answerId),
  });
}

/** Save the follow-up answer text */
export function useSaveFollowUpMutation() {
  return useMutation({
    mutationFn: ({ answerId, followUpAnswer }: { answerId: string; followUpAnswer: string }) =>
      saveFollowUpAnswer(answerId, followUpAnswer),
  });
}

/** End the session early (no summary generated) */
export function useEndSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => endInterviewSession(sessionId),
    onSuccess: () => {
      // Dashboard stats change after any completed session
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
    },
  });
}

/** Complete a session (triggers summary + score calculation) */
export function useCompleteSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => completeInterviewSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
    },
  });
}
