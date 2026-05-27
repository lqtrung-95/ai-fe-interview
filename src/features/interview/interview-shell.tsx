'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ActiveQuestion {
  questionId: string;
  question: string;
  topic: string;
  difficulty: string;
  type: string;
  order: number;
}

interface Props {
  sessionId: string;
  initialQuestion?: ActiveQuestion | null;
  questionTarget: number; // 3 / 5 / 5 depending on mode
}

type Phase = 'idle' | 'loading_question' | 'answering' | 'submitting' | 'completed' | 'error';

export function InterviewShell({ sessionId, initialQuestion, questionTarget }: Props) {
  const [phase, setPhase] = useState<Phase>(initialQuestion ? 'answering' : 'idle');
  const [current, setCurrent] = useState<ActiveQuestion | null>(initialQuestion ?? null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);

  async function loadNextQuestion() {
    setError(null);
    setPhase('loading_question');
    try {
      const r = await fetch(`/api/sessions/${sessionId}/questions/generate`, { method: 'POST' });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${r.status}`);
      }
      const q = (await r.json()) as ActiveQuestion;
      setCurrent(q);
      setDraft('');
      setPhase('answering');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load question');
      setPhase('error');
    }
  }

  async function submitAnswer() {
    if (!current || !draft.trim()) return;
    setError(null);
    setPhase('submitting');
    try {
      const r = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: current.questionId, answer: draft }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${r.status}`);
      }
      // For now: count this answer, load next or finish. Feedback streaming is Phase 03.
      const next = completed + 1;
      setCompleted(next);
      if (next >= questionTarget) {
        setPhase('completed');
        setCurrent(null);
      } else {
        await loadNextQuestion();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit answer');
      setPhase('error');
    }
  }

  if (phase === 'idle') {
    return (
      <Empty title="Ready when you are." cta={<Button onClick={loadNextQuestion}>Start interview</Button>} />
    );
  }

  if (phase === 'loading_question') {
    return <Empty title="Generating your next question…" />;
  }

  if (phase === 'completed') {
    return (
      <Empty
        title={`Session complete — ${completed} of ${questionTarget} answered.`}
        cta={<p className="text-sm text-muted-foreground">Feedback + summary land in Phase 03.</p>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {current && <Badge variant="outline">{current.topic} · {current.difficulty}</Badge>}
          {current && <Badge variant="secondary">{current.type.replace('_', ' ')}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          Question {completed + 1} of {questionTarget}
        </p>
      </header>

      <section className="rounded-lg border border-border/60 bg-card p-6">
        <p className="text-lg font-medium leading-relaxed">{current?.question}</p>
      </section>

      <section className="space-y-3">
        <label htmlFor="answer" className="text-sm font-medium">Your answer</label>
        <textarea
          id="answer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Walk through your thinking. Trade-offs, examples, edge cases."
          rows={10}
          disabled={phase === 'submitting'}
          className="w-full resize-y rounded-md border border-border/60 bg-background p-3 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </section>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{draft.length} chars</p>
        <Button onClick={submitAnswer} disabled={phase === 'submitting' || !draft.trim()}>
          {phase === 'submitting' ? 'Submitting…' : 'Submit answer'}
        </Button>
      </div>
    </div>
  );
}

function Empty({ title, cta }: { title: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-card/50 px-8 py-16 text-center">
      <p className="text-lg font-medium">{title}</p>
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}
