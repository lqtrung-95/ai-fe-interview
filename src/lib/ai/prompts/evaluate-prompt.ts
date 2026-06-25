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
    'Honest-pivot rule: if the candidate hasn\'t used a specific tool/technology but is upfront about it AND either explains how it works or how they solved the underlying problem another way, reward that as a senior signal (honesty + judgment + transferable knowledge) — do NOT score it as a knowledge gap. Only penalize genuine vagueness, evasion, or incorrect claims. A bare "I haven\'t used it" with no reasoning is still weak.',
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
    'Keep arrays focused — max 6 items each. Better answer should be concise (2-4 short paragraphs separated by \\n\\n).',
    'In list item strings, wrap technical terms and key concepts in **double asterisks** (e.g. **virtual DOM**, **O(n)**). Use `backticks` for inline code, APIs, or method names.',
    'In betterAnswer, wrap every significant technical term, API name, method, or concept in `backticks` (e.g. `React Server Components`, `useTransition`, `Suspense`, `INP`). This powers syntax highlighting in the UI.',
  ].join('\n');

  const followBlock = input.followUpAnswer
    ? `\n\nFollow-up discussion (interviewer drilled deeper):\n${sanitize(input.followUpAnswer)}`
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
