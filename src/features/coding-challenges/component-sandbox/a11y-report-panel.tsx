'use client';

import { AlertTriangle, CheckCircle2, XOctagon } from 'lucide-react';
import type { A11yImpact, SandboxResult } from './sandbox-signals';

const IMPACT_STYLE: Record<NonNullable<A11yImpact> | 'unknown', string> = {
  critical: 'bg-red-500/15 text-red-600 dark:text-red-400',
  serious: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  moderate: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  minor: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  unknown: 'bg-muted text-muted-foreground',
};

interface Props {
  result: SandboxResult | null;
  running: boolean;
}

export function A11yReportPanel({ result, running }: Props) {
  if (running && !result) {
    return <Shell><p className="text-sm text-muted-foreground animate-pulse">Rendering & auditing…</p></Shell>;
  }

  if (!result) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Run your component to see a live accessibility audit (powered by axe-core).
        </p>
      </Shell>
    );
  }

  if (result.status !== 'ok') {
    return (
      <Shell>
        <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-2.5">
          <XOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {result.status === 'compile_error' ? "Your code didn't compile" : "Your component didn't render"}
            </p>
            <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
              {result.renderError}
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  const violations = result.a11y?.violations ?? [];

  if (violations.length === 0) {
    return (
      <Shell>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            No automated accessibility violations
            {result.a11y ? <span className="font-normal text-muted-foreground"> · {result.a11y.passCount} axe checks passed</span> : null}
          </p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Automated checks only catch part of the picture — submit for an AI critique of keyboard
          flow, semantics, and the things axe can&apos;t see.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        {violations.length} accessibility {violations.length === 1 ? 'issue' : 'issues'} found
      </div>
      <ul className="space-y-2.5">
        {violations.map((v) => (
          <li key={v.id} className="rounded-lg border border-border/60 bg-card/60 p-3">
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${IMPACT_STYLE[v.impact ?? 'unknown']}`}>
                {v.impact ?? 'info'}
              </span>
              <span className="text-sm font-medium">{v.help}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {v.nodes} {v.nodes === 1 ? 'element' : 'elements'}
              {v.targets.length > 0 && (
                <span className="font-mono"> · {v.targets.join(', ')}</span>
              )}
            </p>
            <a
              href={v.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-primary underline underline-offset-2"
            >
              How to fix ({v.id})
            </a>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Accessibility report
      </p>
      {children}
    </div>
  );
}
