'use client';

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedbackCard } from '@/features/feedback/components/feedback-card';
import type { FeedbackPayload } from '@/features/feedback/feedback-types';
import { CountdownRing } from './components/countdown-ring';
import { VoiceInputButton } from './components/voice-input-button';
import { useSpeechRecognition } from './hooks/use-speech-recognition';
import { FollowupPanel } from './followup-panel';
import type { ActiveQuestion } from './question-stream-types';

interface Props {
  current: ActiveQuestion | null;
  completed: number;
  questionTarget: number;
  draft: string;
  followUp: string;
  followUpDraft: string;
  feedback: FeedbackPayload | null;
  isFollowUp: boolean;
  isFeedback: boolean;
  isSubmitting: boolean;
  error: string | null;
  onDraftChange: (value: string) => void;
  onFollowUpDraftChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onSubmitFollowUp: () => void;
  onSkipFollowUp: () => void;
  onRetryFeedback: () => void;
  onContinue: () => void;
  onEndSession: () => void;
}

export function InterviewMainPanel(props: Props) {
  // Keep a ref so the transcript callback always appends to the latest draft
  // without needing to re-register the hook on every keystroke.
  const draftRef = useRef(props.draft);
  draftRef.current = props.draft;

  const { status: micStatus, toggle: toggleMic, stop: stopMic } = useSpeechRecognition({
    onTranscript: (text) => {
      const separator = draftRef.current ? ' ' : '';
      props.onDraftChange(draftRef.current + separator + text);
    },
  });

  // Stop the mic if the answering phase ends (submitted / follow-up / feedback).
  useEffect(() => {
    if (props.isSubmitting || props.isFollowUp || props.isFeedback) stopMic();
  }, [props.isSubmitting, props.isFollowUp, props.isFeedback, stopMic]);

  // Keyboard shortcuts: Cmd/Ctrl+Enter → submit; Esc → skip follow-up.
  // Stored in refs so the handler always sees the latest props without
  // needing to re-register on every render.
  const propsRef = useRef(props);
  propsRef.current = props;
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const p = propsRef.current;
      const cmdOrCtrl = e.metaKey || e.ctrlKey;

      if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (p.isFollowUp && p.followUpDraft.trim()) {
          p.onSubmitFollowUp();
        } else if (!p.isFollowUp && !p.isFeedback && !p.isSubmitting && p.draft.trim()) {
          p.onSubmitAnswer();
        }
        return;
      }

      if (e.key === 'Escape' && p.isFollowUp) {
        e.preventDefault();
        p.onSkipFollowUp();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // empty deps — handler reads latest values via propsRef

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {props.current && (
            <Badge variant="outline">
              {props.current.topic} · {props.current.difficulty}
            </Badge>
          )}
          {props.current && (
            <Badge variant="secondary">{props.current.type.replace('_', ' ')}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Question {props.completed + 1} of {props.questionTarget}
        </p>
        <Button variant="outline" onClick={props.onEndSession} disabled={props.isSubmitting}>
          End session
        </Button>
      </header>

      <section className="rounded-lg border border-border/70 bg-card p-6 shadow-sm">
        <p className="text-lg font-medium leading-relaxed">{props.current?.question}</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="answer" className="text-sm font-medium">Your answer</label>
          <VoiceInputButton
            status={micStatus}
            onToggle={toggleMic}
            disabled={props.isSubmitting || props.isFollowUp || props.isFeedback}
          />
        </div>
        <textarea
          id="answer"
          value={props.draft}
          onChange={(e) => props.onDraftChange(e.target.value)}
          placeholder="Walk through your thinking. Trade-offs, examples, edge cases."
          rows={10}
          disabled={props.isSubmitting || props.isFollowUp}
          className="min-h-72 w-full resize-y rounded-md border border-border/70 bg-card p-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        {micStatus === 'listening' && (
          <p className="text-xs text-muted-foreground">
            🎙 Listening — speak your answer, then click the mic to stop.
          </p>
        )}
        {micStatus === 'network-failed' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Voice input couldn&apos;t reach the speech service (network error). Type your answer or click the mic icon to retry.
          </p>
        )}
      </section>

      {props.isFollowUp && (
        <FollowupPanel
          followUp={props.followUp}
          value={props.followUpDraft}
          onChange={props.onFollowUpDraftChange}
        />
      )}

      {props.isFeedback && props.feedback && <FeedbackCard feedback={props.feedback} />}

      {props.isFeedback && !props.feedback && (
        <FeedbackFailedNotice
          message={props.error ?? 'Feedback could not be generated.'}
          onRetry={props.onRetryFeedback}
          onContinue={props.onContinue}
        />
      )}

      {props.error && !props.isFeedback && (
        <p className="text-sm text-destructive" role="alert">
          {props.error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {props.isFollowUp ? `${props.followUpDraft.length} chars` : `${props.draft.length} chars`}
          </p>
          <CountdownRing />
        </div>
        {props.isFollowUp ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={props.onSkipFollowUp} title="Esc">
              Skip
              <kbd className="ml-1.5 hidden rounded border border-border px-1 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline">Esc</kbd>
            </Button>
            <Button onClick={props.onSubmitFollowUp} disabled={!props.followUpDraft.trim()} title="⌘ Enter">
              Submit follow-up
              <kbd className="ml-1.5 hidden rounded border border-border/50 bg-primary-foreground/10 px-1 py-0.5 text-[10px] font-mono sm:inline">⌘↵</kbd>
            </Button>
          </div>
        ) : props.isFeedback && props.feedback ? (
          <Button onClick={props.onContinue}>
            Continue
          </Button>
        ) : props.isFeedback ? (
          // Failed-feedback state — actions live in <FeedbackFailedNotice/> above.
          <span />
        ) : (
          <Button
            onClick={props.onSubmitAnswer}
            disabled={props.isSubmitting || !props.draft.trim()}
            title="⌘ Enter"
          >
            {props.isSubmitting ? 'Submitting...' : 'Submit answer'}
            {!props.isSubmitting && (
              <kbd className="ml-1.5 hidden rounded border border-border/50 bg-primary-foreground/10 px-1 py-0.5 text-[10px] font-mono sm:inline">⌘↵</kbd>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function FeedbackFailedNotice({
  message,
  onRetry,
  onContinue,
}: {
  message: string;
  onRetry: () => void;
  onContinue: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4"
    >
      <p className="text-sm font-medium text-destructive">Feedback didn’t come through.</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Your answer is saved — retry to score it, or continue and pick up momentum.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={onRetry}>Retry feedback</Button>
        <Button variant="outline" onClick={onContinue}>
          Continue without feedback
        </Button>
      </div>
    </div>
  );
}
