'use client';

import { Button } from '@/components/ui/button';
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
}

export function InterviewShell({
  sessionId,
  initialQuestion,
  initialCompleted,
  questionTarget,
}: Props) {
  const flow = useInterviewFlow({
    sessionId,
    initialQuestion: initialQuestion ?? null,
    initialCompleted,
    questionTarget,
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

  if (state.phase === 'completed' || state.phase === 'ended') {
    const verb = state.phase === 'completed' ? 'complete' : 'ended';
    return (
      <>
        {banner}
        <InterviewEmptyState
          title={`Session ${verb} — ${state.completed} of ${questionTarget} answered.`}
          cta={<p className="text-sm text-muted-foreground">Summary lands next in Phase 03.</p>}
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
