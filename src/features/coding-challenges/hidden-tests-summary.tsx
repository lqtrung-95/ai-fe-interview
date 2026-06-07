import type { TestResult } from './types';

interface Props {
  testResults: TestResult[];
  hiddenIds: Set<string>;
}

export function HiddenTestsSummary({ testResults, hiddenIds }: Props) {
  const hiddenResults = testResults.filter((r) => hiddenIds.has(r.id));
  if (hiddenResults.length === 0) return null;

  const passed = hiddenResults.filter((r) => r.passed).length;
  const total = hiddenResults.length;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
      <span className="font-medium text-foreground">Hidden tests: </span>
      <span className={passed === total ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
        {passed} / {total} passed
      </span>
    </div>
  );
}
