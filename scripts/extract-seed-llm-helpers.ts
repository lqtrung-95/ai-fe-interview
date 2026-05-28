import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import OpenAI from 'openai';
import type { Difficulty, QuestionType } from './extract-seed-types';

const CACHE_PATH = 'scripts/.translation-cache.json';

// All three providers expose an OpenAI-compatible chat completions endpoint,
// so we route via the OpenAI SDK with an alternate baseURL. Pick via LLM_PROVIDER.
type Provider = 'openai' | 'groq' | 'deepseek';
function getProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (raw === 'groq' || raw === 'deepseek') return raw;
  return 'openai';
}

interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  modelCheap: string; // translation + simple structuring
  modelSmart: string; // question generation from prose
  envVarName: string;
}

function getProviderConfig(): ProviderConfig {
  const provider = getProvider();
  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      throw new Error('DEEPSEEK_API_KEY missing. Get one at https://platform.deepseek.com/api_keys and add to .env.local.');
    }
    return {
      apiKey,
      baseURL: 'https://api.deepseek.com/v1',
      // DeepSeek has one general-purpose chat model — use it for both tiers.
      // (deepseek-reasoner is too slow/expensive for translation; not worth the split.)
      modelCheap: 'deepseek-chat',
      modelSmart: 'deepseek-chat',
      envVarName: 'DEEPSEEK_API_KEY',
    };
  }
  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      throw new Error('GROQ_API_KEY missing. Get one at https://console.groq.com/keys and add to .env.local.');
    }
    return {
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      modelCheap: 'llama-3.1-8b-instant',
      modelSmart: 'llama-3.3-70b-versatile',
      envVarName: 'GROQ_API_KEY',
    };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('OPENAI_API_KEY missing. Add a real key to .env.local before running extract-seed.');
  }
  return {
    apiKey,
    modelCheap: 'gpt-4o-mini',
    modelSmart: 'gpt-4o',
    envVarName: 'OPENAI_API_KEY',
  };
}

let _cache: Record<string, string> | null = null;
let _client: OpenAI | null = null;
let _config: ProviderConfig | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _config = getProviderConfig();
    _client = new OpenAI({ apiKey: _config.apiKey, baseURL: _config.baseURL });
    console.log(`  [llm] using ${getProvider()}: ${_config.modelCheap} (cheap) · ${_config.modelSmart} (smart)`);
  }
  return _client;
}

function modelCheap(): string {
  if (!_config) getClient();
  return _config!.modelCheap;
}

function modelSmart(): string {
  if (!_config) getClient();
  return _config!.modelSmart;
}

function loadCache(): Record<string, string> {
  if (_cache) return _cache;
  if (existsSync(CACHE_PATH)) {
    _cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
  } else {
    _cache = {};
  }
  return _cache!;
}

function saveCache(): void {
  if (!_cache) return;
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(_cache, null, 2));
}

function hashKey(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 16);
}

export async function translateToEnglish(text: string): Promise<string> {
  const cache = loadCache();
  // v3: bumped to force re-translation with OpenAI (overriding cached DeepSeek results).
  const key = `tr_v3:${hashKey(text)}`;
  if (cache[key]) return cache[key];

  const client = getClient();
  const r = await client.chat.completions.create({
    model: modelCheap(),
    messages: [
      {
        role: 'system',
        content:
          'You translate Vietnamese technical interview prep text to natural English. ' +
          'Preserve English technical terms exactly (e.g. stale closure, hydration, useMemo, ' +
          'event loop). Keep tone professional and concise. Output the translation only, no commentary.',
      },
      { role: 'user', content: text },
    ],
    temperature: 0,
  });

  const out = r.choices[0]?.message?.content?.trim() ?? text;
  cache[key] = out;
  saveCache();
  return out;
}

export interface GeneratedQuestion {
  question: string;
  expectedPoints: string[];
  followUps: string[];
  difficulty: Difficulty;
  type: QuestionType;
  subtopic?: string;
  // ELI5: 2-3 sentence plain-English analogy for a non-engineer (no jargon)
  childExplanation?: string;
  // Rich HTML explanation rendered with .study-prose CSS:
  //   <p> paragraphs, <h4> section headings, <strong> key terms,
  //   <ul><li> bullet lists, <code> for inline code/API names
  detailedExplanation?: string;
  // Mermaid diagram source (flowchart LR, 3-8 nodes). Rendered client-side.
  diagramMermaid?: string;
}

/**
 * Given a prose section heading + body, ask the LLM to derive 1-3 interview
 * questions with `expectedPoints` grounded in the section content.
 */
export async function generateQuestionsFromSection(args: {
  topic: string;
  heading: string;
  body: string;
}): Promise<GeneratedQuestion[]> {
  const cache = loadCache();
  // Cache key intentionally omits `args.topic` so re-runs with different topic
  // routing (e.g. "Frontend System Design" → "Web Performance") still hit cache.
  // The topic only affects where the resulting question lands, not its content.
  // v5: force full OpenAI GPT-4o regeneration (v4 entries were DeepSeek).
  const key = `qgen_v5:${hashKey(`${args.heading}|${args.body}`)}`;
  if (cache[key]) {
    try {
      const cached = JSON.parse(cache[key]) as Partial<GeneratedQuestion>[];
      return cached.filter(
        (q): q is GeneratedQuestion => typeof q?.question === 'string' && q.question.trim().length > 0
      );
    } catch {
      // fall through and regenerate
    }
  }

  const client = getClient();
  let r;
  try {
    r = await client.chat.completions.create({
      model: modelSmart(),
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior frontend interview coach. Read the study-guide section (input may be ' +
            'Vietnamese or English) and derive EXACTLY 1 realistic interview question a senior ' +
            'frontend interviewer would actually ask. Required fields:\n' +
            '- `question` (English, concise)\n' +
            '- `expectedPoints` (3-5 short English rubric items grounded in the section)\n' +
            '- `followUps` (1-2 short English follow-up questions)\n' +
            '- `difficulty` (junior|mid|senior)\n' +
            '- `type` (conceptual|debugging|system_design|behavioral|tradeoff)\n' +
            '- `childExplanation` (2-3 sentences in plain English — explain to a smart 10-year-old ' +
            'using a concrete everyday analogy, no jargon)\n' +
            '- `detailedExplanation` (rich HTML, 150–350 words — use <p> for paragraphs, <h4> for ' +
            'section titles, <strong> for key terms, <ul><li> for lists, <code> for code/API names; ' +
            'cover: what it is, how it works, why it matters in production, 1 common pitfall; ' +
            'English only, no markdown fences, no wrapping div)\n' +
            '- `diagramMermaid` (Mermaid diagram source — REQUIRED for EVERY question, no exceptions; ' +
            'use "flowchart LR" or "flowchart TD" syntax with 3-8 nodes that visually explain the core ' +
            'concept; node labels must be short (≤5 words), English only; use --> for arrows, ' +
            'subgraph for grouping related nodes; output raw Mermaid source only, no ```mermaid fences)\n' +
            'Output strict JSON: { "questions": GeneratedQuestion[] }. No markdown.',
        },
        {
          role: 'user',
          content: `Topic: ${args.topic}\nHeading: ${args.heading}\nBody:\n${args.body.slice(0, 1500)}`,
        },
      ],
      temperature: 0.3,
    });
  } catch (err) {
    const e = err as { status?: number; code?: string; message?: string };
    if (e?.status === 429) {
      console.warn(`    ⚠ rate-limited on "${args.heading.slice(0, 60)}" — skipping section`);
      return [];
    }
    throw err;
  }

  const raw = r.choices[0]?.message?.content ?? '{"questions":[]}';
  let parsed: { questions: Partial<GeneratedQuestion>[] } = { questions: [] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const valid: GeneratedQuestion[] = (parsed.questions ?? [])
    .filter((q): q is GeneratedQuestion =>
      typeof q?.question === 'string' && q.question.trim().length > 0
    )
    .map((q) => ({
      question: q.question,
      expectedPoints: Array.isArray(q.expectedPoints) ? q.expectedPoints : [],
      followUps: Array.isArray(q.followUps) ? q.followUps : [],
      difficulty: (['junior', 'mid', 'senior'] as const).includes(q.difficulty as Difficulty)
        ? (q.difficulty as Difficulty)
        : 'mid',
      type: (['conceptual', 'debugging', 'system_design', 'behavioral', 'tradeoff'] as const).includes(
        q.type as QuestionType
      )
        ? (q.type as QuestionType)
        : 'conceptual',
      subtopic: q.subtopic,
      childExplanation: typeof q.childExplanation === 'string' ? q.childExplanation.trim() || undefined : undefined,
      detailedExplanation: typeof q.detailedExplanation === 'string' ? q.detailedExplanation.trim() || undefined : undefined,
      diagramMermaid: typeof q.diagramMermaid === 'string' ? q.diagramMermaid.trim() || undefined : undefined,
    }));

  cache[key] = JSON.stringify(valid);
  saveCache();
  return valid;
}
