import 'server-only';
import type { CodingChallenge } from '@prisma/client';
import type {
  ChallengePublic,
  ComponentChallengePublic,
  TestCasePublic,
} from '@/features/coding-challenges/types';

/** Component spec stored in `testCases` Json for kind='component' challenges. */
type ComponentSpec = {
  componentName: string;
  checks?: ComponentChallengePublic['checks'];
};

type TestCaseRaw = {
  id: string;
  label: string;
  input: string;
  expected: string;
  isHidden: boolean;
};

/**
 * Strips solution and hidden test case expected values before returning to client.
 */
export function toPublicChallenge(ch: CodingChallenge): ChallengePublic {
  // Component challenges store an object spec in `testCases`, not an array.
  // Guard so this projection (used by the shared list) is safe for both kinds.
  const rawTestCases = Array.isArray(ch.testCases) ? (ch.testCases as unknown as TestCaseRaw[]) : [];
  const testCases = rawTestCases.map(
    (tc): TestCasePublic => ({
      id: tc.id,
      label: tc.label,
      input: tc.input,
      isHidden: tc.isHidden,
      // Include expected only for visible test cases — helps render unit test assertions in the UI
      // Hidden test cases must never expose their expected value to the client
      ...(tc.isHidden ? {} : { expected: tc.expected }),
    })
  );

  return {
    id: ch.id,
    title: ch.title,
    description: ch.description,
    difficulty: ch.difficulty as 'junior' | 'mid' | 'senior',
    topic: ch.topic,
    tags: ch.tags,
    starterCode: ch.starterCode,
    testCases,
    hints: (ch.hints as unknown as string[]) ?? [],
    timeLimit: ch.timeLimit,
  };
}

/**
 * Projects a 'component' challenge for the client. The solution stays server-side;
 * the component name (needed by the sandbox) lives in the `testCases` Json spec.
 */
export function toPublicComponentChallenge(ch: CodingChallenge): ComponentChallengePublic {
  const spec = (ch.testCases as unknown as ComponentSpec) ?? { componentName: 'App' };
  return {
    id: ch.id,
    title: ch.title,
    description: ch.description,
    difficulty: ch.difficulty as 'junior' | 'mid' | 'senior',
    topic: ch.topic,
    tags: ch.tags,
    starterCode: ch.starterCode,
    hints: (ch.hints as unknown as string[]) ?? [],
    componentName: spec.componentName ?? 'App',
    checks: spec.checks ?? [],
  };
}
