/**
 * Generates src/data/resources/glossary.json from the handbook content.
 *
 * Batches the handbook sections into 5 thematic groups and extracts ~130
 * glossary terms total using the same LLM provider as the handbook extraction.
 *
 * Run:  pnpm extract-glossary
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import type { GlossaryEntry, GlossaryCategory } from '../src/data/resources/glossary-types';

// ─── LLM client (mirrors extract-seed-llm-helpers setup) ─────────────────────

type Provider = 'openai' | 'groq' | 'deepseek';

function buildClient(): { client: OpenAI; model: string } {
  const raw = (process.env.LLM_PROVIDER ?? 'deepseek').toLowerCase() as Provider;

  if (raw === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === 'placeholder') throw new Error('DEEPSEEK_API_KEY missing in .env.local');
    return {
      client: new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' }),
      model: 'deepseek-chat',
    };
  }
  if (raw === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'placeholder') throw new Error('GROQ_API_KEY missing in .env.local');
    return {
      client: new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' }),
      model: 'llama-3.3-70b-versatile',
    };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'placeholder') throw new Error('OPENAI_API_KEY missing in .env.local');
  return { client: new OpenAI({ apiKey }), model: 'gpt-4o-mini' };
}

// ─── Handbook loader ──────────────────────────────────────────────────────────

interface RawSection {
  id: string;
  title: string;
  intro: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[];
}

function loadHandbook(): RawSection[] {
  const raw = readFileSync(
    join(process.cwd(), 'src/data/resources/frontend-system-design.json'),
    'utf-8',
  );
  return (JSON.parse(raw) as { sections: RawSection[] }).sections;
}

/** Pull readable text from a section's content blocks (skip SVG / quiz / flashcards). */
function sectionText(s: RawSection): string {
  const parts: string[] = [];
  if (s.intro) parts.push(s.intro);
  for (const b of s.blocks) {
    if (b.type === 'h3' || b.type === 'h4') parts.push(b.text as string);
    else if (b.type === 'p') parts.push((b.html as string).replace(/<[^>]+>/g, ''));
    else if (b.type === 'ul' || b.type === 'ol') parts.push((b.items as string[]).join('. '));
    else if (b.type === 'callout') parts.push(`${b.title}: ${b.body}`);
  }
  return parts.join(' ').slice(0, 3000);
}

// ─── Batches ──────────────────────────────────────────────────────────────────

const BATCHES: { label: string; ids: string[] }[] = [
  {
    label: 'Foundation & Architecture',
    ids: ['intro', 'requirements', 'architecture', 'components', 'designsystem', 'modfed', 'scale'],
  },
  {
    label: 'Rendering, Performance & Caching',
    ids: ['rendering', 'performance', 'caching', 'assets', 'pwa', 'build', 'bundler'],
  },
  {
    label: 'Networking, Real-time & Security',
    ids: ['network', 'realtime', 'security', 'protocol', 'httpcache', 'tracing', 'monitoring'],
  },
  {
    label: 'JavaScript Engine, Browser & State',
    ids: ['jsengine', 'eventloop', 'browser', 'state'],
  },
  {
    label: 'Testing & Accessibility',
    ids: ['testing', 'advtesting', 'storybook', 'a11y'],
  },
];

const VALID_CATEGORIES: GlossaryCategory[] = [
  'Performance', 'Rendering', 'Networking', 'JavaScript', 'Browser',
  'State Management', 'Architecture', 'Testing', 'Accessibility', 'Security',
  'Build & Tooling',
];

// ─── Extraction ───────────────────────────────────────────────────────────────

async function extractBatch(
  label: string,
  sections: RawSection[],
  client: OpenAI,
  model: string,
): Promise<GlossaryEntry[]> {
  const sectionDocs = sections
    .map(s => `## ${s.title} (id: ${s.id})\n${sectionText(s)}`)
    .join('\n\n---\n\n');

  const resp = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      {
        role: 'system',
        content: `You are building a frontend engineering interview glossary.
Extract key technical terms from the provided handbook content and define them clearly.
Return ONLY a valid JSON array — no markdown fences, no preamble.
Each item must have this exact shape:
{
  "term": "full term name",
  "abbr": "ABBR" or null,
  "definition": "2-3 sentences suitable for interview prep",
  "category": one of [${VALID_CATEGORIES.map(c => `"${c}"`).join(', ')}],
  "handbookId": "section id from the content" or null
}`,
      },
      {
        role: 'user',
        content: `Extract 20-30 glossary terms from these handbook sections about "${label}".
Focus on terms an interviewer might ask: "what is X?", "explain X", or "when would you use X?".
Include: abbreviations, patterns, APIs, protocols, algorithms, and browser APIs.

${sectionDocs}`,
      },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? '[]';
  const clean = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

  let parsed: GlossaryEntry[];
  try {
    parsed = JSON.parse(clean) as GlossaryEntry[];
  } catch {
    // Recover by finding the JSON array bounds
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error(`No JSON array in response for "${label}"`);
    parsed = JSON.parse(clean.slice(start, end + 1)) as GlossaryEntry[];
  }

  return parsed
    .filter(e => e.term && e.definition && e.category)
    .map(e => ({
      term: String(e.term).trim(),
      ...(e.abbr ? { abbr: String(e.abbr).trim() } : {}),
      definition: String(e.definition).trim(),
      category: (VALID_CATEGORIES.includes(e.category) ? e.category : 'Architecture') as GlossaryCategory,
      ...(e.handbookId ? { handbookId: String(e.handbookId).trim() } : {}),
    }));
}

function dedupe(entries: GlossaryEntry[]): GlossaryEntry[] {
  const seen = new Map<string, GlossaryEntry>();
  for (const e of entries) {
    const key = e.term.toLowerCase();
    // Keep the entry with a handbookId if there is one
    if (!seen.has(key) || (!seen.get(key)!.handbookId && e.handbookId)) {
      seen.set(key, e);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.term.localeCompare(b.term));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { client, model } = buildClient();
  console.log(`📖 Extracting glossary using model: ${model}\n`);

  const sections = loadHandbook();
  const sectionMap = new Map(sections.map(s => [s.id, s]));
  const all: GlossaryEntry[] = [];

  for (const batch of BATCHES) {
    console.log(`  [${batch.label}]`);
    const batchSections = batch.ids
      .map(id => sectionMap.get(id))
      .filter(Boolean) as RawSection[];

    const entries = await extractBatch(batch.label, batchSections, client, model);
    console.log(`    → ${entries.length} terms`);
    all.push(...entries);
  }

  const entries = dedupe(all);
  console.log(`\n✅ ${entries.length} unique terms`);

  const outPath = join(process.cwd(), 'src/data/resources/glossary.json');
  writeFileSync(outPath, JSON.stringify({ entries }, null, 2));
  console.log(`💾 ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
