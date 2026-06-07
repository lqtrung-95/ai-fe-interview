import 'server-only';
import type { TestResult } from '@/features/coding-challenges/types';

type RawTestResult = {
  id: string;
  passed: boolean;
  actual?: string;
  error?: string;
};

type TestCaseMeta = {
  id: string;
  isHidden: boolean;
};

/**
 * Parses Piston stdout (JSON array of test results), merges with test case metadata,
 * and strips actual/error values from hidden test cases before returning the client response.
 */
export function parseAndValidateResults(
  stdout: string,
  testCases: TestCaseMeta[]
): { testResults: TestResult[]; passedCount: number; totalCount: number; status: 'passed' | 'failed' | 'error' } {
  const raw = parseLastJsonArray(stdout);

  if (!raw) {
    return {
      testResults: testCases.map((tc) => ({ id: tc.id, passed: false, error: 'No output' })),
      passedCount: 0,
      totalCount: testCases.length,
      status: 'error',
    };
  }

  const hiddenIds = new Set(testCases.filter((tc) => tc.isHidden).map((tc) => tc.id));

  const testResults: TestResult[] = raw.map((r: RawTestResult) => {
    if (hiddenIds.has(r.id)) {
      // Strip actual/error values for hidden test cases
      return { id: r.id, passed: r.passed };
    }
    return { id: r.id, passed: r.passed, actual: r.actual, error: r.error };
  });

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = testCases.length;
  const hasError = raw.some((r: RawTestResult) => r.error && !r.passed);
  const status: 'passed' | 'failed' | 'error' =
    passedCount === totalCount ? 'passed' : hasError ? 'error' : 'failed';

  return { testResults, passedCount, totalCount, status };
}

function parseLastJsonArray(stdout: string): RawTestResult[] | null {
  // Find the last valid JSON array in stdout — tolerates user console.log output before results
  const lines = stdout.trim().split('\n').reverse();
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line.trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not valid JSON, continue
    }
  }
  return null;
}
