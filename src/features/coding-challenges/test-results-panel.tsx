'use client';

import { CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { HiddenTestsSummary } from './hidden-tests-summary';
import type { SubmissionResult, TestCasePublic } from './types';

interface Props {
  result: SubmissionResult;
  testCases: TestCasePublic[];
  // Rendered below the panel by parent when Pro user has passed
  aiReviewSlot?: React.ReactNode;
}

export function TestResultsPanel({ result, testCases, aiReviewSlot }: Props) {
  const visibleCases = testCases.filter((tc) => !tc.isHidden);
  const hiddenIds = new Set(testCases.filter((tc) => tc.isHidden).map((tc) => tc.id));
  const visibleResults = result.testResults.filter((r) => !hiddenIds.has(r.id));

  const allPassed = result.status === 'passed';
  const somePassed = result.passedCount > 0 && !allPassed;

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      {/* Banner */}
      <div
        className={
          'rounded-lg px-4 py-3 text-sm font-medium ' +
          (allPassed
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : somePassed
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'bg-red-500/10 text-red-700 dark:text-red-400')
        }
      >
        {allPassed
          ? `✓ All ${result.totalCount} tests passed`
          : `✗ ${result.passedCount} / ${result.totalCount} tests passed`}
      </div>

      {/* Visible test results */}
      <div className="space-y-2">
        {visibleResults.map((r) => {
          const tc = visibleCases.find((tc) => tc.id === r.id);
          return (
            <details key={r.id} className="group rounded-lg border border-border/60 bg-card/60">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-sm select-none">
                {r.passed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
                <span className="flex-1 font-medium text-foreground">{tc?.label ?? r.id}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-border/40 px-4 py-3 space-y-1.5 text-xs font-mono">
                {r.actual !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Actual: </span>
                    <span className="text-foreground">{r.actual}</span>
                  </div>
                )}
                {r.error && (
                  <div>
                    <span className="text-muted-foreground">Error: </span>
                    <span className="text-red-600 dark:text-red-400">{r.error}</span>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <HiddenTestsSummary testResults={result.testResults} hiddenIds={hiddenIds} />

      {aiReviewSlot}
    </div>
  );
}
