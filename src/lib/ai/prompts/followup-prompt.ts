import 'server-only';
import type { FollowupInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

/** PRD §9.2 — Follow-up question. */
export function buildFollowupPrompt(input: FollowupInput): {
  system: string;
  user: string;
} {
  const system = [
    'You are conducting a frontend technical interview.',
    'Ask ONE relevant follow-up question based on the user\'s answer.',
    'Requirements:',
    '- Test depth, trade-off thinking, or practical experience.',
    '- Do not ask multiple questions at once.',
    '- Do not reveal the ideal answer.',
    '- Output strict JSON: { "followUp": string }.',
  ].join('\n');

  const user = [
    `Difficulty: ${input.difficulty}`,
    '',
    `Question:\n${sanitize(input.question, 800)}`,
    '',
    `User answer:\n${sanitize(input.userAnswer)}`,
  ].join('\n');

  return { system, user };
}
