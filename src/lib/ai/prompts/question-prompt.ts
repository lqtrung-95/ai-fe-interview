import 'server-only';
import type { QuestionInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

/** PRD §9.1 — Interview question generation. */
export function buildQuestionPrompt(input: QuestionInput): {
  system: string;
  user: string;
} {
  const cvInstruction = input.cvContext
    ? '\n- When candidate background is provided, tailor the question to probe their specific companies, projects, or technologies. Prefer "Walk me through how you…" or "At [company] you worked on…" framing.'
    : '';

  const jdInstruction = input.jdContext
    ? '\n- When a target job context is provided, probe the technologies and domain in that JD. Prefer scenario framing tied to the company\'s domain (e.g. high-scale payments, marketplace, SaaS).'
    : '';

  const system = [
    'You are a realistic technical interviewer for a frontend engineering role.',
    'Generate ONE interview question that matches the user level and topic.',
    'Requirements:',
    '- Realistic phrasing — what an actual interviewer would say.',
    '- Concise, no preamble.',
    '- For senior level, lean into trade-offs, architecture, debugging, scalability.',
    '- Do NOT include the answer.',
    `- Output strict JSON: { "question": string, "type": "conceptual"|"debugging"|"system_design"|"behavioral"|"tradeoff", "expectedPoints": string[] (3-6 short rubric items) }.${cvInstruction}${jdInstruction}`,
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

  // Context blocks — NOT logged anywhere; only live in the LLM prompt for this request.
  const cvBlock = input.cvContext ? `\n\n${input.cvContext}` : '';
  const jdBlock = input.jdContext ? `\n\nTarget job context:\n${input.jdContext}` : '';

  const user = [
    `Topic: ${input.topic}`,
    input.subtopic ? `Subtopic: ${input.subtopic}` : null,
    `Difficulty: ${input.difficulty}`,
    `User level: ${input.level}`,
    `Session mode: ${input.sessionMode}`,
    // JD context supersedes generic targetRole/targetCompanyType when present
    !input.jdContext && input.targetRole ? `Target role: ${input.targetRole}` : null,
    !input.jdContext && input.targetCompanyType ? `Company type: ${input.targetCompanyType}` : null,
    avoid,
    cvBlock,
    jdBlock,
    seedBlock,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
