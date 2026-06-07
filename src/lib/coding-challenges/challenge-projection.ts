import 'server-only';
import type { CodingChallenge } from '@prisma/client';
import type { ChallengePublic, TestCasePublic } from '@/features/coding-challenges/types';

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
  const testCases = (ch.testCases as unknown as TestCaseRaw[]).map(
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
