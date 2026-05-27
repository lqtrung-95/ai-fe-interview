import type { FeedbackPayload } from '@/features/feedback/feedback-types';

interface DemoTurn {
  question: string;
  topic: string;
  difficulty: 'mid' | 'senior';
  type: string;
  userAnswer: string;
  feedback: FeedbackPayload;
}

/**
 * Static, hand-crafted walkthrough of one realistic interview turn. Rendered
 * by the public /demo page with the real FeedbackCard component so the demo
 * looks identical to a live session — no DB writes, no AI calls.
 */
export const DEMO_TURN: DemoTurn = {
  topic: 'React',
  difficulty: 'senior',
  type: 'debugging',
  question:
    "A React page renders fine on first load but feels janky during heavy user interaction. How would you investigate and fix it?",
  userAnswer:
    'I would open React Profiler and see which components re-render. If many components re-render, I would memoize them with React.memo and useMemo. I might also lift state up or push it down to limit the affected subtree.',
  feedback: {
    id: 'demo-feedback',
    answerId: 'demo-answer',
    overallScore: 3.2,
    scores: {
      correctness: 4,
      completeness: 3,
      clarity: 3,
      depth: 3,
      tradeoffThinking: 3,
      communication: 3,
    },
    whatWentWell: [
      'Correctly reaches for React Profiler as the first measurement tool.',
      'Mentions both memoization and state-placement as real levers.',
    ],
    whatWasMissing: [
      'No mention of distinguishing rendering jank vs. JS execution vs. layout thrash.',
      'No reference to actual metrics (INP, long-task durations).',
      'Memoization is offered as a default fix rather than a targeted one.',
    ],
    technicalCorrections: [
      'React.memo + useMemo only help when render cost is the bottleneck. For event-handler jank, useCallback + debouncing or scheduling with startTransition is usually more impactful.',
    ],
    improvementSuggestions: [
      'Structure the answer as: measure → classify (render/JS/layout) → target the actual hotspot → verify.',
      'Name the specific Profiler signals you would look for (commit duration, wasted renders).',
    ],
    betterAnswer:
      "I would avoid guessing and start with measurement. First, capture an INP / long-task trace under the slow interaction to classify the bottleneck: is it React render time, JavaScript execution in a handler, layout thrash, or main-thread blocking from a third-party script? React Profiler shows commit durations and wasted renders; the Performance panel shows long tasks. From there I apply a targeted fix — startTransition or useDeferredValue for stale-while-typing, useCallback + ref-based handlers to avoid re-binding, virtualization for large lists, or splitting state so high-frequency updates don't re-render the world. Memoization (React.memo, useMemo) goes on the specific components I measured as hot, not as a default. Finally, I verify the win with the same trace.",
    seniorLevelAddition:
      "At a senior level I would also wire performance budgets and a regression check — for example, a CI gate on INP for the affected route, and a runtime mark in the handler we just optimized, so the win doesn't silently regress as the team layers features on.",
    recommendedNextPractice: [
      'React rendering deep-dive: when memoization actually helps.',
      'Frontend performance metrics: INP, long tasks, CLS.',
      'Debugging strategy: isolating render vs. JS vs. layout.',
    ],
  },
};
