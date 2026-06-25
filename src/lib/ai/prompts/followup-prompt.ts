import 'server-only';
import type { FollowupInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

/** PRD §9.2 — Follow-up question. */
export function buildFollowupPrompt(input: FollowupInput): {
  system: string;
  user: string;
} {
  const hasPrior = !!input.priorFollowups?.trim();

  const system = [
    'You are conducting a frontend technical interview.',
    'Ask ONE relevant follow-up question based on the conversation.',
    'Requirements:',
    '- Test depth, trade-off thinking, or practical experience.',
    hasPrior
      ? '- This is a DEEPER follow-up in an ongoing drill. Go one level deeper than the previous follow-ups (why → how → what broke → what you\'d do differently / how you measured it). Pick something specific the candidate just said. Do NOT repeat earlier follow-ups.'
      : '- Drill into a specific decision, trade-off, or claim in their answer.',
    '- Build on what the candidate actually said; do not introduce facts they did not mention.',
    '- Do not ask multiple questions at once.',
    '- Do not reveal the ideal answer.',
    '- Output strict JSON: { "followUp": string }.',
  ].join('\n');

  const priorBlock = hasPrior
    ? `\n\nEarlier follow-ups in this thread (most recent last):\n${sanitize(input.priorFollowups!, 2000)}`
    : '';

  const user = [
    `Difficulty: ${input.difficulty}`,
    '',
    `Original question:\n${sanitize(input.question, 800)}`,
    '',
    `Candidate's first answer:\n${sanitize(input.userAnswer)}`,
    priorBlock,
  ].join('\n');

  return { system, user };
}
