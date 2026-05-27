import 'server-only';
import { prisma } from '@/lib/db/client';

/**
 * Persists per-call AI telemetry to `AICall`. Pricing tables are coarse
 * estimates kept in code — refine as Groq publishes paid-tier prices and
 * OpenAI/Anthropic rates shift. Used for cost dashboards in Phase 04+.
 */

interface UsdRate {
  prompt: number; // USD per million prompt tokens
  completion: number; // USD per million completion tokens
}

const RATES: Record<string, UsdRate> = {
  // Groq free tier — $0 in practice; tiny positive number keeps charts non-zero.
  'groq:cheap': { prompt: 0.05, completion: 0.08 },
  'groq:smart': { prompt: 0.59, completion: 0.79 },
  // OpenAI (Jan 2026 reference prices)
  'openai:cheap': { prompt: 0.15, completion: 0.6 },
  'openai:smart': { prompt: 2.5, completion: 10 },
  // Anthropic (Jan 2026 reference prices)
  'anthropic:cheap': { prompt: 1.0, completion: 5.0 },
  'anthropic:smart': { prompt: 3.0, completion: 15.0 },
};

function estimateCost(modelId: string, promptTokens: number, completionTokens: number): number {
  const rate = RATES[modelId] ?? { prompt: 0, completion: 0 };
  return (promptTokens / 1_000_000) * rate.prompt + (completionTokens / 1_000_000) * rate.completion;
}

export interface CostMeterArgs {
  userId?: string;
  sessionId?: string;
  task: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  succeeded: boolean;
  errorReason?: string;
}

export async function recordAICall(args: CostMeterArgs): Promise<void> {
  const costUsd = estimateCost(args.modelId, args.promptTokens, args.completionTokens);
  try {
    await prisma.aICall.create({
      data: {
        userId: args.userId,
        sessionId: args.sessionId,
        task: args.task,
        model: args.modelId,
        promptTokens: args.promptTokens,
        completionTokens: args.completionTokens,
        // Decimal-typed column; Prisma accepts number for small values.
        costUsd: costUsd,
        latencyMs: args.latencyMs,
        succeeded: args.succeeded,
        errorReason: args.errorReason,
      },
    });
  } catch (err) {
    // Telemetry failure must never break the user-facing flow.
    console.error('[cost-meter] failed to persist AICall row:', err);
  }
}
