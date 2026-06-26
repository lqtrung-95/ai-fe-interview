import 'server-only';

/**
 * LLM-based CV text extraction.
 * Sends raw CV text to the cheap-tier model and returns a validated CvData object.
 * Provider is controlled by LLM_PROVIDER / LLM_CHEAP_PROVIDER env vars (default: deepseek).
 */

import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { groq } from '@ai-sdk/groq';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildCvParsePrompt } from '@/lib/ai/prompts/cv-parse-prompt';
import { cvDataSchema, type CvData } from './cv-types';

/** Pick the cheap-tier model — same logic as model-router but inlined to avoid
 *  importing AITask types here (cv-parser has no dependency on interview schemas). */
function cheapModel() {
  const raw = (
    process.env.LLM_CHEAP_PROVIDER ??
    process.env.LLM_PROVIDER ??
    'deepseek'
  ).toLowerCase();

  if (raw === 'openrouter') {
    const or = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY ?? '',
      headers: { 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://frontendcoach.app', 'X-Title': 'Frontend Coach' },
    });
    // `.chat()` forces /v1/chat/completions — OpenRouter has no /v1/responses API.
    return or.chat(process.env.OPENROUTER_CHEAP_MODEL ?? 'meta-llama/llama-3.1-8b-instruct');
  }
  if (raw === 'groq')      return groq('llama-3.1-8b-instant');
  if (raw === 'openai')    return openai('gpt-4o-mini');
  if (raw === 'anthropic') return anthropic('claude-haiku-4-5-20251001');
  return deepseek('deepseek-chat');
}

/**
 * Parse raw CV text into a structured CvData object using an LLM.
 *
 * On LLM or parse failure, returns a minimal empty CvData rather than throwing
 * so the upload flow doesn't break — the UI can surface a warning.
 */
export async function parseCvText(rawText: string): Promise<CvData> {
  const { system, user } = buildCvParsePrompt(rawText);

  let responseText: string;
  try {
    const { text } = await generateText({
      model: cheapModel(),
      system,
      prompt: user,
      temperature: 0.1,
      maxOutputTokens: 2000,
    });
    responseText = text;
  } catch (err) {
    console.error('[cv-parser] LLM call failed:', err instanceof Error ? err.message : err);
    return cvDataSchema.parse({}); // safe empty fallback
  }

  // Strip accidental markdown code fences the model may emit
  const cleaned = responseText
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return cvDataSchema.parse(parsed);
  } catch (err) {
    console.error('[cv-parser] JSON parse/validation failed:', err instanceof Error ? err.message : err);
    console.error('[cv-parser] Raw response (first 500 chars):', responseText.slice(0, 500));
    return cvDataSchema.parse({}); // safe empty fallback
  }
}
