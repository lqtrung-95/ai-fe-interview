import 'server-only';
import type { QuestionInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

/** PRD §9.1 — Interview question generation. */
export function buildQuestionPrompt(input: QuestionInput): {
  system: string;
  user: string;
} {
  const system = [
    'You are a realistic technical interviewer for a frontend engineering role.',
    'Generate ONE interview question that matches the user level and topic.',
    'Requirements:',
    '- Realistic phrasing — what an actual interviewer would say.',
    '- Concise, no preamble.',
    '- For senior level, lean into trade-offs, architecture, debugging, scalability.',
    '- Do NOT include the answer.',
    '- Output strict JSON: { "question": string, "type": "conceptual"|"debugging"|"system_design"|"behavioral"|"tradeoff", "expectedPoints": string[] (3-6 short rubric items) }.',
  ].join('\n');

  const avoid =
    input.avoidQuestions.length > 0
      ? `\n\nAlready asked this session (do NOT repeat or paraphrase):\n${input.avoidQuestions
          .map((q) => `- ${sanitize(q, 200)}`)
          .join('\n')}`
      : '';

  const seedBlock = input.seed
    ? [
        '\n\nUse this seed question as the basis. Rephrase it naturally for an interview setting',
        'but keep the same topic + expectedPoints (you may refine expectedPoints).',
        `Seed question: ${sanitize(input.seed.question, 400)}`,
        `Seed expectedPoints:\n${input.seed.expectedPoints.map((p) => `- ${sanitize(p, 200)}`).join('\n')}`,
      ].join('\n')
    : '';

  const user = [
    `Topic: ${input.topic}`,
    input.subtopic ? `Subtopic: ${input.subtopic}` : null,
    `Difficulty: ${input.difficulty}`,
    `User level: ${input.level}`,
    `Session mode: ${input.sessionMode}`,
    input.targetRole ? `Target role: ${input.targetRole}` : null,
    input.targetCompanyType ? `Company type: ${input.targetCompanyType}` : null,
    avoid,
    seedBlock,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
