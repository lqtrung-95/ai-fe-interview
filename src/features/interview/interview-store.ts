import { create } from 'zustand';
import type { FeedbackPayload } from '@/features/feedback/feedback-types';
import type { ActiveQuestion } from './question-stream-types';

export type InterviewPhase =
  | 'idle'
  | 'loading_question'
  | 'answering'
  | 'submitting'
  | 'generating_followup'
  | 'generating_feedback'
  | 'feedback'
  | 'followup'
  | 'ended'
  | 'completed'
  | 'error';

interface InterviewState {
  phase: InterviewPhase;
  current: ActiveQuestion | null;
  draft: string;
  error: string | null;
  completed: number;
  streamingQuestion: string;
  answerId: string | null;
  followUp: string;
  followUpDraft: string;
  feedback: FeedbackPayload | null;
  rateLimitedUntil: number | null;
  // --- Timer (opt-in countdown per question, 0 = disabled) ---
  timerSeconds: number;   // configured duration; 0 means no timer
  timeLeft: number;       // seconds remaining for the current question
  timerActive: boolean;   // true while counting down in 'answering' phase
  hydrate: (question: ActiveQuestion | null, completed: number) => void;
  setPhase: (phase: InterviewPhase) => void;
  setDraft: (draft: string) => void;
  setError: (error: string | null) => void;
  setRateLimit: (retryAfterSeconds: number | null) => void;
  setStreamingQuestion: (question: string) => void;
  setAnswerId: (answerId: string | null) => void;
  setFollowUp: (followUp: string) => void;
  setFollowUpDraft: (draft: string) => void;
  setFeedback: (feedback: FeedbackPayload | null) => void;
  startQuestionLoad: () => void;
  setLoadedQuestion: (question: ActiveQuestion) => void;
  finishQuestion: (questionTarget: number) => boolean;
  markEnded: () => void;
  setTimerSeconds: (seconds: number) => void;
  tickTimer: () => void;
  stopTimer: () => void;
}

const initialState = {
  phase: 'idle' as InterviewPhase,
  current: null,
  draft: '',
  error: null,
  completed: 0,
  streamingQuestion: '',
  answerId: null,
  followUp: '',
  followUpDraft: '',
  feedback: null,
  rateLimitedUntil: null as number | null,
  timerSeconds: 0,
  timeLeft: 0,
  timerActive: false,
};

export const useInterviewStore = create<InterviewState>((set, get) => ({
  ...initialState,
  hydrate: (question, completed) =>
    set({
      ...initialState,
      // Preserve configured timerSeconds across question transitions
      timerSeconds: get().timerSeconds,
      phase: question ? 'answering' : 'idle',
      current: question,
      completed,
    }),
  setPhase: (phase) => set({ phase }),
  setDraft: (draft) => set({ draft }),
  setError: (error) => set({ error }),
  setRateLimit: (retryAfterSeconds) =>
    set({
      rateLimitedUntil: retryAfterSeconds ? Date.now() + retryAfterSeconds * 1000 : null,
    }),
  setStreamingQuestion: (streamingQuestion) => set({ streamingQuestion }),
  setAnswerId: (answerId) => set({ answerId }),
  setFollowUp: (followUp) => set({ followUp }),
  setFollowUpDraft: (followUpDraft) => set({ followUpDraft }),
  setFeedback: (feedback) => set({ feedback }),
  startQuestionLoad: () =>
    set({
      phase: 'loading_question',
      error: null,
      streamingQuestion: '',
      timerActive: false,  // pause timer while loading
    }),
  setLoadedQuestion: (current) => {
    const { timerSeconds } = get();
    set({
      current,
      draft: '',
      answerId: null,
      followUp: '',
      followUpDraft: '',
      feedback: null,
      streamingQuestion: '',
      phase: 'answering',
      // Reset timer for each new question
      timeLeft: timerSeconds,
      timerActive: timerSeconds > 0,
    });
  },
  finishQuestion: (questionTarget) => {
    const next = get().completed + 1;
    if (next >= questionTarget) {
      set({ completed: next, phase: 'completed', current: null, timerActive: false });
      return true;
    }
    set({ completed: next, timerActive: false });
    return false;
  },
  markEnded: () => set({ current: null, phase: 'ended', timerActive: false }),
  setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),
  tickTimer: () =>
    set((state) => ({
      timeLeft: Math.max(0, state.timeLeft - 1),
      timerActive: state.timeLeft > 1,
    })),
  stopTimer: () => set({ timerActive: false }),
}));
