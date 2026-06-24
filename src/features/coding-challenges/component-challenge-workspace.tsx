'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { marked } from 'marked';
import { Lightbulb, Play, RotateCcw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { AiCodeReviewPanel } from './ai-code-review-panel';
import { A11yReportPanel } from './component-sandbox/a11y-report-panel';
import { useComponentSandbox } from './component-sandbox/use-component-sandbox';
import { toSignalSummary } from './component-sandbox/sandbox-signals';
import type { ComponentChallengePublic } from './types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-card text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

interface Props {
  challenge: ComponentChallengePublic;
  isAuthenticated: boolean;
  isPro: boolean;
}

export function ComponentChallengeWorkspace({ challenge, isAuthenticated, isPro }: Props) {
  const { resolvedTheme } = useTheme();
  const [code, setCode] = useState(challenge.starterCode);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { iframeRef, srcdoc, ready, running, result, run } = useComponentSandbox(
    challenge.componentName,
    challenge.checks,
  );

  // Auto-render the starter once the sandbox is ready so the preview isn't blank.
  useEffect(() => {
    if (ready) run(code);
    // Only on the ready transition — manual runs are explicit afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const rendered = result?.status === 'ok';

  async function handleSubmit() {
    if (!isAuthenticated) {
      setError('Sign in to submit your component for an AI critique.');
      return;
    }
    if (!result) {
      setError('Run your component first, then submit.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSubmissionId(null);
    try {
      const res = await fetch(`/api/coding-challenges/${challenge.id}/submit-component`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, signals: toSignalSummary(result) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? 'Something went wrong. Please try again.');
        return;
      }
      const data = (await res.json()) as { submissionId: string };
      setSubmissionId(data.submissionId);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      {/* Left — brief + live signals */}
      <div className="w-full space-y-5 overflow-y-auto border-b border-border/60 p-5 md:w-1/2 md:border-b-0 md:border-r">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Build challenge</Badge>
            <Badge variant="outline">{challenge.difficulty}</Badge>
            <Badge variant="outline">{challenge.topic}</Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{challenge.title}</h1>
          <div
            className="challenge-prose text-sm"
            dangerouslySetInnerHTML={{ __html: marked.parse(challenge.description) as string }}
          />
        </div>

        {challenge.hints.length > 0 && (
          <details className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Hints
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {challenge.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </details>
        )}

        <A11yReportPanel result={result} running={running} />

        {/* Submit + AI critique */}
        <div className="space-y-3">
          {!submissionId && (
            isPro ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !rendered}
                className={buttonVariants({ className: 'w-full gap-1.5' })}
                title={!rendered ? 'Run your component first' : undefined}
              >
                <Sparkles className="h-4 w-4" />
                {submitting ? 'Submitting…' : 'Submit for AI critique'}
              </button>
            ) : (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                The accessibility audit is free. {' '}
                <Link href="/upgrade" className="text-primary underline underline-offset-2">
                  Upgrade to Pro
                </Link>{' '}
                for a senior AI critique of your component.
              </div>
            )
          )}

          {error && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              {error}
              {!isAuthenticated && (
                <Link href="/sign-in" className="ml-2 text-primary underline underline-offset-2">Sign in</Link>
              )}
            </div>
          )}

          {submissionId && (
            <AiCodeReviewPanel
              challengeId={challenge.id}
              submissionId={submissionId}
              intro="Get a senior AI critique — accessibility, re-renders, component API, and what a senior would add."
            />
          )}
        </div>
      </div>

      {/* Right — editor + live preview */}
      <div className="flex w-full flex-col md:w-1/2">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {challenge.componentName}.jsx
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setCode(challenge.starterCode); setSubmissionId(null); setError(null); }}
              className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' gap-1.5 text-xs'}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              onClick={() => run(code)}
              disabled={!ready || running}
              className={buttonVariants({ size: 'sm' }) + ' gap-1.5 text-xs'}
            >
              <Play className="h-3 w-3" />
              {running ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <MonacoEditor
            height="100%"
            language="javascript"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            // JSX is valid here but Monaco's plain-JS worker flags it — silence the
            // false squiggles so the editor doesn't look broken.
            onMount={(_editor, monaco) => {
              monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
              });
            }}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Live preview */}
        <div className="border-t border-border/60">
          <p className="px-3 pt-2 py-2 text-xs font-medium text-muted-foreground">Live preview</p>
          <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            title="Component preview"
            className="h-[34vh] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
