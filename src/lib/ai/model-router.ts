import 'server-only';
import type { LanguageModel } from 'ai';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { deepseek } from '@ai-sdk/deepseek';
import type { AITask } from '@/features/interview/ai-schemas';

// ----------------------------------------------------------------------------
// Provider router. Pick provider per tier via env vars; fall back to LLM_PROVIDER;
// fall back to deepseek (currently the user-funded default).
//
// Pick model by task tier:
//   - cheap = high-volume, structuring-heavy (question gen, follow-up)
//   - smart = quality-critical (evaluation, summary)
// ----------------------------------------------------------------------------

type Provider = 'groq' | 'openai' | 'anthropic' | 'deepseek';
type Tier = 'cheap' | 'smart';

function pickProvider(tier: Tier): Provider {
  const override = tier === 'smart' ? process.env.LLM_SMART_PROVIDER : process.env.LLM_CHEAP_PROVIDER;
  const fallback = process.env.LLM_PROVIDER ?? 'deepseek';
  const raw = (override ?? fallback).toLowerCase();
  if (raw === 'openai' || raw === 'anthropic' || raw === 'groq' || raw === 'deepseek') return raw;
  return 'deepseek';
}

function modelFor(provider: Provider, tier: Tier): LanguageModel {
  if (provider === 'deepseek') {
    // DeepSeek ships one general-purpose chat model; same for both tiers.
    return deepseek('deepseek-chat');
  }
  if (provider === 'groq') {
    return tier === 'cheap'
      ? groq('llama-3.1-8b-instant')
      : groq('llama-3.3-70b-versatile');
  }
  if (provider === 'openai') {
    return tier === 'cheap' ? openai('gpt-4o-mini') : openai('gpt-4o');
  }
  // anthropic
  return tier === 'cheap'
    ? anthropic('claude-haiku-4-5-20251001')
    : anthropic('claude-sonnet-4-6');
}

/** Map each AI task to its tier. */
function tierForTask(task: AITask['type']): Tier {
  switch (task) {
    case 'generate_question':
    case 'generate_followup':
      return 'cheap';
    case 'evaluate_answer':
    case 'generate_summary':
      return 'smart';
  }
}

export function routeModel(task: AITask['type']): {
  model: LanguageModel;
  provider: Provider;
  tier: Tier;
  modelId: string;
} {
  const tier = tierForTask(task);
  const provider = pickProvider(tier);
  const model = modelFor(provider, tier);
  // `modelId` is best-effort: AI SDK doesn't expose it uniformly.
  // We synthesize the label for telemetry.
  const modelId = `${provider}:${tier === 'cheap' ? 'cheap' : 'smart'}`;
  return { model, provider, tier, modelId };
}
