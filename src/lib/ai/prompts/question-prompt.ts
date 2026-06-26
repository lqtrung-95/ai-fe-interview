import 'server-only';
import type { QuestionInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

/** PRD §9.1 — Interview question generation. */
export function buildQuestionPrompt(input: QuestionInput): {
  system: string;
  user: string;
} {
  const hasTranscript = !!input.transcript && input.transcript.length > 0;

  // CV/experience sessions are conversational: open with an invitation to tell a
  // story, then drill into what the candidate ACTUALLY said — never assert what
  // they did or invent a premise.
  let cvInstruction = '';
  if (input.cvContext && hasTranscript) {
    cvInstruction =
      '\n- You are mid-interview. Read the candidate\'s most recent answer in the conversation below. Pick ONE specific thing THEY actually said — a decision, technology, trade-off, or challenge — and drill one level deeper into its technical foundation, trade-offs, or what they would do differently. Reference their own words. Do NOT introduce facts, projects, or technologies they did not mention, and do NOT assert they used something. If their last answer was vague, ask them to get concrete (mechanisms, numbers, alternatives they weighed).';
  } else if (input.cvContext) {
    cvInstruction =
      '\n- This is the OPENING question. Use the candidate background only as context and INVITE a story — e.g. "Tell me about the most technically challenging thing you built at <company>" or "Walk me through a project you\'re proud of and the hardest problem in it." Keep it open; do NOT assert what they did or quiz a specific API. Set "type" to "behavioral".';
  }

  const jdInstruction = input.jdContext
    ? '\n- When a target job context is provided, probe the technologies and domain in that JD. Prefer scenario framing tied to the company\'s domain (e.g. high-scale payments, marketplace, SaaS).'
    : '';

  const system = [
    'You are a realistic technical interviewer for a frontend engineering role.',
    'Generate ONE interview question that matches the user level and topic.',
    'Requirements:',
    '- Realistic phrasing — what an actual interviewer would say.',
    '- Ask ONE focused question. Do NOT stack multiple sub-questions or list several APIs to explain in a single prompt.',
    '- This is a spoken/written-discussion interview, NOT a live coding screen. The candidate answers in prose. Phrase questions to be answered by EXPLAINING — the approach, mechanism, and trade-offs. Avoid imperatives that demand writing a full implementation ("implement", "write a function that…", "code a…"); instead ask "how would you approach…", "walk me through how X works", or "what\'s your strategy for…". A candidate may sketch a small snippet, but the question must be fully answerable by talking through it.',
    '- Never assert the candidate did something specific unless they stated it; invite ("Have you run into…? If so… if not, how would you approach…") rather than presume.',
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

  // Recent conversation so the model can drill into the candidate's own words.
  const transcriptBlock = hasTranscript
    ? `\n\nConversation so far (most recent last):\n${input
        .transcript!.map(
          (t) => `Interviewer: ${sanitize(t.question, 300)}\nCandidate: ${sanitize(t.answer, 600)}`,
        )
        .join('\n\n')}`
    : '';

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
    transcriptBlock,
    seedBlock,
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
