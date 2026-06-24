export type TestCasePublic = {
  id: string;
  label: string;
  input: string;
  isHidden: boolean;
  // expected is included for visible test cases (to render unit test assertions),
  // omitted for hidden cases so users can't read the answer
  expected?: string;
};

export type TestResult = {
  id: string;
  passed: boolean;
  actual?: string;  // omitted for hidden cases in client response
  error?: string;   // omitted for hidden cases in client response
};

export type ChallengePublic = {
  id: string;
  title: string;
  description: string;
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
  tags: string[];
  starterCode: string;
  testCases: TestCasePublic[];
  hints: string[];
  timeLimit: number;
};

export type ChallengeWithStatus = ChallengePublic & {
  userStatus: 'solved' | 'attempted' | 'unsolved';
  /** 'component' = Build & Critique (live React + a11y); 'function' = classic JS. */
  kind: 'function' | 'component';
};

export type SubmissionResult = {
  submissionId: string;
  status: 'passed' | 'failed' | 'error';
  testResults: TestResult[];
  passedCount: number;
  totalCount: number;
  executionMs: number | null;
};

/** Public shape for a 'component' challenge (React UI built + graded in-browser). */
export type ComponentChallengePublic = {
  id: string;
  title: string;
  description: string;
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
  tags: string[];
  starterCode: string;
  hints: string[];
  /** Name the user's exported component must use, so the sandbox can render it. */
  componentName: string;
};
