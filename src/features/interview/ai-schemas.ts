import { z } from 'zod';

// ----------------------------------------------------------------------------
// AI task input types — what the orchestrator receives from services.
// Output types — what AI returns (validated via Zod before persistence).
// ----------------------------------------------------------------------------

// Question difficulty (the 3 ratings a question can carry).
export const difficultyEnum = z.enum(['junior', 'mid', 'senior']);
// User seniority level — includes 'staff' which maps to senior-difficulty questions.
export const levelEnum = z.enum(['junior', 'mid', 'senior', 'staff']);
export const questionTypeEnum = z.enum([
  'conceptual',
  'debugging',
  'system_design',
  'behavioral',
  'tradeoff',
]);
export const sessionModeEnum = z.enum(['quick', 'standard', 'deep_coaching']);

// ----- generate_question -----

export const questionInputSchema = z.object({
  topic: z.string(),
  subtopic: z.string().optional(),
  difficulty: difficultyEnum,
  level: levelEnum,
  sessionMode: sessionModeEnum,
  targetRole: z.string().nullable().optional(),
  targetCompanyType: z.string().nullable().optional(),
  // Provided when rephrasing a seed question (hybrid 70% path).
  seed: z
    .object({
      question: z.string(),
      expectedPoints: z.array(z.string()),
    })
    .optional(),
  // Avoid repeating questions already asked in this session.
  avoidQuestions: z.array(z.string()).default([]),
  // Formatted CV context injected when the session uses CV-grounded mode.
  // Max 1 200 chars — built by buildCvContext(). NOT stored in AICall logs.
  cvContext: z.string().max(1200).optional(),
  // Formatted JD context injected when session targets a specific job (Pro).
  // Max 600 chars — built by formatJdContext(). NOT stored in AICall logs.
  jdContext: z.string().max(600).optional(),
});
export type QuestionInput = z.infer<typeof questionInputSchema>;

export const questionOutputSchema = z.object({
  question: z.string().min(10),
  type: questionTypeEnum,
  expectedPoints: z.array(z.string()).min(2).max(8),
});
export type QuestionOutput = z.infer<typeof questionOutputSchema>;

// ----- generate_followup -----

export const followupInputSchema = z.object({
  question: z.string(),
  userAnswer: z.string(),
  difficulty: difficultyEnum,
});
export type FollowupInput = z.infer<typeof followupInputSchema>;

export const followupOutputSchema = z.object({
  followUp: z.string().min(5),
});
export type FollowupOutput = z.infer<typeof followupOutputSchema>;

// ----- evaluate_answer -----

export const evaluateInputSchema = z.object({
  question: z.string(),
  expectedPoints: z.array(z.string()),
  userAnswer: z.string(),
  followUpAnswer: z.string().optional(),
  level: levelEnum,
});
export type EvaluateInput = z.infer<typeof evaluateInputSchema>;

const scoreSchema = z.number().int().min(1).max(5);

export const evaluateOutputSchema = z.object({
  overallScore: z.number().min(1).max(5),
  scores: z.object({
    correctness: scoreSchema,
    completeness: scoreSchema,
    clarity: scoreSchema,
    depth: scoreSchema,
    tradeoffThinking: scoreSchema,
    communication: scoreSchema,
  }),
  whatWentWell: z.array(z.string()).max(6),
  whatWasMissing: z.array(z.string()).max(6),
  technicalCorrections: z.array(z.string()).max(6),
  improvementSuggestions: z.array(z.string()).max(6),
  betterAnswer: z.string().min(50),
  seniorLevelAddition: z.string().optional(),
  recommendedNextPractice: z.array(z.string()).max(5),
});
export type EvaluateOutput = z.infer<typeof evaluateOutputSchema>;

// ----- generate_summary -----

export const summaryInputSchema = z.object({
  userProfile: z.object({
    level: levelEnum,
    targetRole: z.string().nullable().optional(),
    targetCompanyType: z.string().nullable().optional(),
  }),
  perAnswer: z.array(
    z.object({
      question: z.string(),
      topic: z.string(),
      difficulty: difficultyEnum,
      overallScore: z.number(),
      missingPoints: z.array(z.string()),
    })
  ),
});
export type SummaryInput = z.infer<typeof summaryInputSchema>;

export const summaryOutputSchema = z.object({
  overallScore: z.number().min(1).max(5),
  strongAreas: z.array(z.string()).max(5),
  weakAreas: z.array(z.string()).max(5),
  repeatedMistakes: z.array(z.string()).max(5),
  recommendedTopics: z.array(z.string()).max(5),
  actionItems: z.array(z.string()).min(1).max(5),
});
export type SummaryOutput = z.infer<typeof summaryOutputSchema>;

// ----- extract_jd — one-time extraction when saving a TargetJob (Pro) -----

export const extractJdInputSchema = z.object({
  rawJd: z.string().max(8000),
});
export type ExtractJdInput = z.infer<typeof extractJdInputSchema>;

export const extractJdOutputSchema = z.object({
  role: z.string(),
  company: z.string().optional(),
  level: z.string().optional(),
  domain: z.string(),
  requiredStack: z.array(z.string()).max(10),
  signals: z.array(z.string()).max(6),
});
export type ExtractJdOutput = z.infer<typeof extractJdOutputSchema>;

// ----- review_code — streaming AI code review (Pro, passing submissions only) -----

export type ReviewCodeInput = {
  challengeTitle: string;
  challengeDescription: string;
  userCode: string;
  testsPassed: string; // e.g. "5 / 5"
};

// ----- Union task type for orchestrator -----

export type AITask =
  | { type: 'generate_question'; input: QuestionInput }
  | { type: 'generate_followup'; input: FollowupInput }
  | { type: 'evaluate_answer'; input: EvaluateInput }
  | { type: 'generate_summary'; input: SummaryInput }
  | { type: 'extract_jd'; input: ExtractJdInput };

export type AITaskResult<T extends AITask> = T extends { type: 'generate_question' }
  ? QuestionOutput
  : T extends { type: 'generate_followup' }
  ? FollowupOutput
  : T extends { type: 'evaluate_answer' }
  ? EvaluateOutput
  : T extends { type: 'generate_summary' }
  ? SummaryOutput
  : T extends { type: 'extract_jd' }
  ? ExtractJdOutput
  : never;
