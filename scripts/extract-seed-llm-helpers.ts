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
  const key = `tr:${hashKey(text)}`;
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
  const key = `qgen:${hashKey(`${args.heading}|${args.body}`)}`;
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
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior frontend interview coach. Read the study-guide section (input may be ' +
            'Vietnamese or English) and derive EXACTLY 1 realistic interview question a senior ' +
            'frontend interviewer would actually ask. Required fields: `question` (in English, ' +
            'concise), `expectedPoints` (3-5 short English rubric items grounded in the section), ' +
            '`followUps` (1-2 short English follow-ups), `difficulty` (junior|mid|senior), `type` ' +
            '(conceptual|debugging|system_design|behavioral|tradeoff). Output strict JSON: ' +
            '{ "questions": GeneratedQuestion[] }. No markdown.',
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
    }));

  cache[key] = JSON.stringify(valid);
  saveCache();
  return valid;
}
