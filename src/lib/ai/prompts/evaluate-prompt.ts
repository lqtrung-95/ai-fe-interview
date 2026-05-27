import 'server-only';
import type { EvaluateInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

/** PRD §9.3 — Answer evaluation. The quality-critical prompt. */
export function buildEvaluatePrompt(input: EvaluateInput): {
  system: string;
  user: string;
} {
  const system = [
    'You are an expert frontend interview coach.',
    'Evaluate the candidate\'s answer using the rubric below. Be honest, specific, and actionable.',
    'Do NOT over-praise weak answers. Do NOT give only generic feedback.',
    '',
    'Score 1-5 for each dimension:',
    '- correctness: technically accurate?',
    '- completeness: covers important points?',
    '- clarity: easy to follow?',
    '- depth: senior-level understanding?',
    '- tradeoffThinking: pros/cons/alternatives?',
    '- communication: well-structured?',
    '',
    'Return strict JSON matching this shape:',
    '{ overallScore: number (1-5, can be decimal), scores: { correctness, completeness, clarity, depth, tradeoffThinking, communication: int 1-5 },',
    '  whatWentWell: string[], whatWasMissing: string[], technicalCorrections: string[], improvementSuggestions: string[],',
    '  betterAnswer: string (interview-ready, concise), seniorLevelAddition: string (optional), recommendedNextPractice: string[] }',
    '',
    'Keep arrays focused — max 6 items each. Better answer should be concise (2-4 short paragraphs).',
  ].join('\n');

  const followBlock = input.followUpAnswer
    ? `\n\nFollow-up answer:\n${sanitize(input.followUpAnswer)}`
    : '';

  const user = [
    `User level: ${input.level}`,
    '',
    `Question:\n${sanitize(input.question, 800)}`,
    '',
    `Expected points to cover:\n${input.expectedPoints.map((p) => `- ${sanitize(p, 200)}`).join('\n')}`,
    '',
    `User answer:\n${sanitize(input.userAnswer)}`,
    followBlock,
  ].join('\n');

  return { system, user };
}
