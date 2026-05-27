import 'server-only';
import { generateObject } from 'ai';
import type { ZodSchema } from 'zod';
import {
  type AITask,
  type AITaskResult,
  questionInputSchema,
  questionOutputSchema,
  followupInputSchema,
  followupOutputSchema,
  evaluateInputSchema,
  evaluateOutputSchema,
  summaryInputSchema,
  summaryOutputSchema,
} from '@/features/interview/ai-schemas';
import { routeModel } from './model-router';
import { recordAICall } from './cost-meter';
import { buildQuestionPrompt } from './prompts/question-prompt';
import { buildFollowupPrompt } from './prompts/followup-prompt';
import { buildEvaluatePrompt } from './prompts/evaluate-prompt';
import { buildSummaryPrompt } from './prompts/summary-prompt';

/**
 * Single choke point for every AI call in the app. Responsibilities:
 *   - Validate input via Zod
 *   - Route to provider/model by task tier
 *   - Generate structured output via Vercel AI SDK
 *   - One retry on validation failure
 *   - Always record cost telemetry (success or failure)
 */

interface RunOptions {
  userId?: string;
  sessionId?: string;
}

export async function runAITask<T extends AITask>(
  task: T,
  options: RunOptions = {}
): Promise<AITaskResult<T>> {
  validateInput(task);

  const { model, modelId } = routeModel(task.type);
  const { system, user } = buildPrompt(task);
  const schema = outputSchemaFor(task) as unknown as ZodSchema<AITaskResult<T>>;

  const start = Date.now();
  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt < 2) {
    attempt++;
    try {
      const result = await generateObject({
        model,
        schema,
        system,
        prompt: user,
        temperature: temperatureFor(task.type),
        maxOutputTokens: maxTokensFor(task.type),
      });

      const validated = schema.parse(result.object);

      await recordAICall({
        userId: options.userId,
        sessionId: options.sessionId,
        task: task.type,
        modelId,
        promptTokens: result.usage?.inputTokens ?? 0,
        completionTokens: result.usage?.outputTokens ?? 0,
        latencyMs: Date.now() - start,
        succeeded: true,
      });

      return validated;
    } catch (err) {
      lastErr = err;
      // Schema or generation error → one retry. Network/auth errors → bail immediately.
      if (attempt < 2 && isRetryableError(err)) {
        continue;
      }
      break;
    }
  }

  await recordAICall({
    userId: options.userId,
    sessionId: options.sessionId,
    task: task.type,
    modelId,
    promptTokens: 0,
    completionTokens: 0,
    latencyMs: Date.now() - start,
    succeeded: false,
    errorReason: lastErr instanceof Error ? lastErr.message : String(lastErr),
  });

  throw lastErr instanceof Error ? lastErr : new Error('AI task failed');
}

// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

function validateInput(task: AITask): void {
  switch (task.type) {
    case 'generate_question':
      questionInputSchema.parse(task.input);
      return;
    case 'generate_followup':
      followupInputSchema.parse(task.input);
      return;
    case 'evaluate_answer':
      evaluateInputSchema.parse(task.input);
      return;
    case 'generate_summary':
      summaryInputSchema.parse(task.input);
      return;
  }
}

function outputSchemaFor(task: AITask) {
  switch (task.type) {
    case 'generate_question':
      return questionOutputSchema;
    case 'generate_followup':
      return followupOutputSchema;
    case 'evaluate_answer':
      return evaluateOutputSchema;
    case 'generate_summary':
      return summaryOutputSchema;
  }
}

function buildPrompt(task: AITask): { system: string; user: string } {
  switch (task.type) {
    case 'generate_question':
      return buildQuestionPrompt(task.input);
    case 'generate_followup':
      return buildFollowupPrompt(task.input);
    case 'evaluate_answer':
      return buildEvaluatePrompt(task.input);
    case 'generate_summary':
      return buildSummaryPrompt(task.input);
  }
}

function temperatureFor(type: AITask['type']): number {
  switch (type) {
    case 'generate_question':
      return 0.7;
    case 'generate_followup':
      return 0.5;
    case 'evaluate_answer':
      return 0.2;
    case 'generate_summary':
      return 0.3;
  }
}

function maxTokensFor(type: AITask['type']): number {
  switch (type) {
    case 'generate_question':
      return 500;
    case 'generate_followup':
      return 150;
    case 'evaluate_answer':
      return 2000;
    case 'generate_summary':
      return 800;
  }
}

function isRetryableError(err: unknown): boolean {
  const e = err as { name?: string; status?: number; message?: string };
  if (e?.name === 'ZodError' || e?.name === 'AI_TypeValidationError') return true;
  if (e?.status && e.status >= 500) return true;
  return false;
}
