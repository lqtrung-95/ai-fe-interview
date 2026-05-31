'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RateLimitBanner } from '@/components/common/rate-limit-banner';
import { InterviewEmptyState } from './interview-empty-state';
import { InterviewMainPanel } from './interview-main-panel';
import { useInterviewFlow } from './use-interview-flow';
import type { ActiveQuestion } from './question-stream-types';

interface Props {
  sessionId: string;
  initialQuestion?: ActiveQuestion | null;
  initialCompleted: number;
  questionTarget: number;
  timerSeconds?: number;
}

export function InterviewShell({
  sessionId,
  initialQuestion,
  initialCompleted,
  questionTarget,
  timerSeconds = 0,
}: Props) {
  const flow = useInterviewFlow({
    sessionId,
    initialQuestion: initialQuestion ?? null,
    initialCompleted,
    questionTarget,
    timerSeconds,
  });
  const state = flow.state;

  const banner =
    state.rateLimitedUntil && state.rateLimitedUntil > Date.now() ? (
      <div className="mb-4">
        <RateLimitBanner
          until={state.rateLimitedUntil}
          onExpire={() => state.setRateLimit(null)}
        />
      </div>
    ) : null;

  if (state.phase === 'idle') {
    return (
      <>
        {banner}
        <InterviewEmptyState
          title="Ready when you are."
          cta={<Button onClick={flow.loadNextQuestion}>Start interview</Button>}
        />
      </>
    );
  }

  if (state.phase === 'loading_question') {
    return (
      <>
        {banner}
        <InterviewEmptyState
          title="Generating your next question..."
          detail={state.streamingQuestion || 'Preparing the interview context.'}
        />
      </>
    );
  }

  if (state.phase === 'generating_followup') {
    return (
      <>
        {banner}
        <InterviewEmptyState
          title="Preparing a follow-up..."
          detail="Checking where to probe deeper."
        />
      </>
    );
  }

  if (state.phase === 'generating_feedback') {
    return (
      <>
        {banner}
        <InterviewEmptyState
          title="Generating feedback..."
          detail="Scoring your answer and preparing a stronger version."
        />
      </>
    );
  }

  // 'completed' = all questions answered, waiting for completeSession API + redirect.
  // Show a loading state so users don't see a confusing flash of empty content.
  if (state.phase === 'completed') {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-12">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">Preparing your session summary…</p>
          <p className="text-xs text-muted-foreground">Organising scores and your next practice steps.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  // 'ended' = user clicked "End session" early
  if (state.phase === 'ended') {
    return (
      <>
        {banner}
        <InterviewEmptyState
          title={`Session ended — ${state.completed} of ${questionTarget} answered.`}
          detail="Your answers have been saved. Check History to review your performance."
        />
      </>
    );
  }

  return (
    <>
      {banner}
      <InterviewMainPanel
      current={state.current}
      completed={state.completed}
      questionTarget={questionTarget}
      draft={state.draft}
      followUp={state.followUp}
      followUpDraft={state.followUpDraft}
      feedback={state.feedback}
      isFollowUp={state.phase === 'followup'}
      isFeedback={state.phase === 'feedback'}
      isSubmitting={state.phase === 'submitting'}
      error={state.error}
      onDraftChange={state.setDraft}
      onFollowUpDraftChange={state.setFollowUpDraft}
      onSubmitAnswer={flow.submitAnswer}
      onSubmitFollowUp={flow.submitFollowUp}
      onSkipFollowUp={flow.skipFollowUp}
      onRetryFeedback={flow.retryFeedback}
      onContinue={flow.finishQuestion}
      onEndSession={flow.endEarly}
      />
    </>
  );
}
