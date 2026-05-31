'use client';

import { useEffect } from 'react';
import { fetchFeedbackStream } from '@/features/feedback/use-feedback-stream';
import { RateLimitError } from '@/lib/http/rate-limit-error';
import {
  useCompleteSessionMutation,
  useEndSessionMutation,
  useGenerateFollowUpMutation,
  useSaveFollowUpMutation,
  useSubmitAnswerMutation,
} from './hooks/use-interview-mutations';
import { useInterviewTimer } from './hooks/use-interview-timer';
import { useInterviewStore } from './interview-store';
import { fetchQuestionStream } from './use-question-stream';
import type { ActiveQuestion } from './question-stream-types';

interface Args {
  sessionId: string;
  initialQuestion: ActiveQuestion | null;
  initialCompleted: number;
  questionTarget: number;
  timerSeconds: number;
}

export function useInterviewFlow(args: Args) {
  const state = useInterviewStore();

  // Mutation hooks — own network I/O state; Zustand store owns UI phase transitions
  const submitAnswerMutation    = useSubmitAnswerMutation();
  const generateFollowUpMutation = useGenerateFollowUpMutation();
  const saveFollowUpMutation    = useSaveFollowUpMutation();
  const endSessionMutation      = useEndSessionMutation();
  const completeSessionMutation = useCompleteSessionMutation();

  useEffect(() => {
    // Set timer config before hydrate so the first question picks it up.
    state.setTimerSeconds(args.timerSeconds);
    state.hydrate(args.initialQuestion, args.initialCompleted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.initialCompleted, args.initialQuestion, args.timerSeconds]);

  // Centralizes RateLimitError detection so each catch site stays terse.
  const recordError = (err: unknown, fallback: string) => {
    if (err instanceof RateLimitError) state.setRateLimit(err.retryAfter);
    state.setError(err instanceof Error ? err.message : fallback);
  };

  async function loadNextQuestion() {
    state.startQuestionLoad();
    try {
      const question = await fetchQuestionStream(args.sessionId, {
        onPartial: state.setStreamingQuestion,
      });
      state.setLoadedQuestion(question);
    } catch (e) {
      recordError(e, 'Failed to load question');
      state.setPhase('error');
    }
  }

  async function submitAnswer(force = false) {
    const { current, draft } = state;
    // Normal submit: requires non-empty draft.
    // force=true (timer expiry): submits even with empty draft so the AI can
    // acknowledge the timeout and show what a good answer looks like.
    if (!current) return;
    if (!force && !draft.trim()) return;
    state.stopTimer(); // stop ring during follow-up / feedback phases
    state.setError(null);
    state.setPhase('submitting');
    try {
      const answerId = await submitAnswerMutation.mutateAsync({
        questionId: current.questionId,
        answer: draft, // may be empty string on timeout — backend handles it
      });
      state.setAnswerId(answerId);
      await loadFollowUp(answerId);
    } catch (e) {
      recordError(e, 'Failed to submit answer');
      state.setPhase('error');
    }
  }

  /** Called by the timer when it reaches 0 with an empty draft. */
  function submitOnTimerExpiry() {
    void submitAnswer(true);
  }

  async function loadFollowUp(answerId: string) {
    state.setPhase('generating_followup');
    try {
      state.setFollowUp(await generateFollowUpMutation.mutateAsync(answerId));
      state.setPhase('followup');
    } catch (e) {
      recordError(e, 'Failed to generate follow-up');
      await generateFeedback(answerId);
    }
  }

  async function submitFollowUp() {
    const { answerId, followUpDraft } = state;
    if (!answerId || !followUpDraft.trim()) return;
    state.setError(null);
    state.setPhase('submitting');
    try {
      await saveFollowUpMutation.mutateAsync({ answerId, followUpAnswer: followUpDraft });
      await generateFeedback(answerId);
    } catch (e) {
      recordError(e, 'Failed to submit follow-up');
      state.setPhase('followup');
    }
  }

  async function generateFeedback(answerId: string) {
    state.setError(null);
    state.setPhase('generating_feedback');
    try {
      const feedback = await fetchFeedbackStream(answerId, { onPartial: () => undefined });
      state.setFeedback(feedback);
      state.setPhase('feedback');
    } catch (e) {
      recordError(e, 'Failed to generate feedback');
      state.setPhase('feedback');
    }
  }

  async function finishQuestion() {
    const isDone = state.finishQuestion(args.questionTarget);
    if (isDone) {
      try {
        await completeSessionMutation.mutateAsync(args.sessionId);
        window.location.href = `/practice/${args.sessionId}/complete`;
      } catch (e) {
        // Completing the session failed — surface the error and allow retry
        recordError(e, 'Failed to complete session');
        state.setPhase('error');
      }
      return;
    }
    await loadNextQuestion();
  }

  async function endEarly() {
    state.setError(null);
    state.setPhase('submitting');
    try {
      await endSessionMutation.mutateAsync(args.sessionId);
      state.markEnded();
    } catch (e) {
      recordError(e, 'Failed to end session');
      state.setPhase(state.current ? 'answering' : 'idle');
    }
  }

  // Drive per-question countdown.
  // Both paths call submitAnswer — force=true allows the empty-draft case
  // so the AI can acknowledge the timeout and show a model answer.
  useInterviewTimer(submitAnswer, submitOnTimerExpiry);

  return {
    state,
    loadNextQuestion,
    submitAnswer,
    submitFollowUp,
    skipFollowUp: () => state.answerId && generateFeedback(state.answerId),
    retryFeedback: () => state.answerId && generateFeedback(state.answerId),
    finishQuestion,
    endEarly,
  };
}
