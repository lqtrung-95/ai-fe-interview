import { z } from 'zod';

// ----------------------------------------------------------------------------
// AI task input types — what the orchestrator receives from services.
// Output types — what AI returns (validated via Zod before persistence).
// ----------------------------------------------------------------------------

export const difficultyEnum = z.enum(['junior', 'mid', 'senior']);
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
  level: difficultyEnum,
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
  level: difficultyEnum,
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
    level: difficultyEnum,
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

// ----- Union task type for orchestrator -----

export type AITask =
  | { type: 'generate_question'; input: QuestionInput }
  | { type: 'generate_followup'; input: FollowupInput }
  | { type: 'evaluate_answer'; input: EvaluateInput }
  | { type: 'generate_summary'; input: SummaryInput };

export type AITaskResult<T extends AITask> = T extends { type: 'generate_question' }
  ? QuestionOutput
  : T extends { type: 'generate_followup' }
  ? FollowupOutput
  : T extends { type: 'evaluate_answer' }
  ? EvaluateOutput
  : T extends { type: 'generate_summary' }
  ? SummaryOutput
  : never;
