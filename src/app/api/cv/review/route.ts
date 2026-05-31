import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { requireUser } from '@/lib/auth/session';
import { buildCvReviewPrompt } from '@/lib/ai/prompts/cv-review-prompt';
import { cvReviewSchema } from '@/features/cv-review/cv-review-types';
import type { CvData } from '@/lib/cv/cv-types';

/** Cheap-tier model — same selection logic as cv-parser. */
function cheapModel() {
  const raw = (process.env.LLM_CHEAP_PROVIDER ?? process.env.LLM_PROVIDER ?? 'deepseek').toLowerCase();
  if (raw === 'groq')      return groq('llama-3.3-70b-versatile');
  if (raw === 'openai')    return openai('gpt-4o-mini');
  if (raw === 'anthropic') return anthropic('claude-haiku-4-5-20251001');
  return deepseek('deepseek-chat');
}

/**
 * POST /api/cv/review
 * Returns AI feedback on the user's stored CV.
 * Ephemeral — feedback is NOT stored in the DB or AICall logs.
 */
export async function POST() {
  const user = await requireUser();

  if (!user.cvData) {
    return NextResponse.json(
      { ok: false, error: 'No CV found. Upload your CV in Settings first.' },
      { status: 400 },
    );
  }

  const cvData = user.cvData as CvData;
  const { system, user: userPrompt } = buildCvReviewPrompt(cvData);

  try {
    const { object } = await generateObject({
      model: cheapModel(),
      schema: cvReviewSchema,
      system,
      prompt: userPrompt,
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    // Intentionally NOT calling recordAICall — CV content must not appear in logs.
    return NextResponse.json({ ok: true, review: object });
  } catch (err) {
    console.error('[cv/review] generation failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate review. Please try again.' },
      { status: 500 },
    );
  }
}
