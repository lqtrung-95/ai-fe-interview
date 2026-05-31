/**
 * Generates src/data/resources/javascript-core.json
 * A comprehensive JavaScript interview handbook, fully LLM-generated.
 *
 * Structure: 10 sections across 4 groups, each with 6-10 content blocks
 * including explanations, code examples, callouts, quizzes, and flashcards.
 *
 * Run:  pnpm generate-js-handbook
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });

type Provider = 'openai' | 'groq' | 'deepseek';
function buildClient(): { client: OpenAI; model: string } {
  const raw = (process.env.LLM_PROVIDER ?? 'deepseek').toLowerCase() as Provider;
  if (raw === 'groq') {
    const apiKey = process.env.GROQ_API_KEY!;
    return { client: new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' }), model: 'llama-3.3-70b-versatile' };
  }
  if (raw === 'openai') {
    return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }), model: 'gpt-4o-mini' };
  }
  return { client: new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: 'https://api.deepseek.com/v1' }), model: 'deepseek-chat' };
}

// ─── Section definitions ──────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'types',      num: '01 — FOUNDATION',  group: 'FOUNDATION',  title: 'Types, Values & Coercion',        topics: ['primitive vs reference types', 'type coercion and ==', 'typeof and instanceof', 'null vs undefined', 'NaN', 'BigInt, Symbol'] },
  { id: 'scope',      num: '02 — FOUNDATION',  group: 'FOUNDATION',  title: 'Scope, Closures & Hoisting',      topics: ['var/let/const differences', 'function vs block scope', 'hoisting mechanics', 'closure definition and use cases', 'IIFE pattern', 'temporal dead zone'] },
  { id: 'functions',  num: '03 — FOUNDATION',  group: 'FOUNDATION',  title: 'Functions, this & Execution',     topics: ['function declarations vs expressions', 'arrow vs regular functions', 'this binding rules', 'call/apply/bind', 'arguments object vs rest params', 'currying'] },
  { id: 'prototypes', num: '04 — CORE',        group: 'CORE',        title: 'Prototypes & Inheritance',        topics: ['prototype chain', 'Object.create', 'class syntax under the hood', 'mixin patterns', 'instanceof and prototype checks', 'Object.getPrototypeOf'] },
  { id: 'eventloop',  num: '05 — CORE',        group: 'CORE',        title: 'Event Loop & Asynchrony',         topics: ['call stack', 'task queue vs microtask queue', 'setTimeout/setInterval ordering', 'requestAnimationFrame', 'queueMicrotask', 'event loop in Node.js vs browser'] },
  { id: 'promises',   num: '06 — CORE',        group: 'CORE',        title: 'Promises & Async/Await',          topics: ['Promise states', 'promise chaining', 'Promise.all/race/allSettled/any', 'async/await internals', 'error handling with try/catch', 'common async pitfalls'] },
  { id: 'es6',        num: '07 — MODERN JS',   group: 'MODERN JS',   title: 'ES6+ & Modern Syntax',            topics: ['destructuring', 'spread/rest', 'template literals', 'optional chaining and nullish coalescing', 'generators and iterators', 'WeakMap/WeakSet/WeakRef'] },
  { id: 'modules',    num: '08 — MODERN JS',   group: 'MODERN JS',   title: 'Modules & the Build Pipeline',   topics: ['ES modules vs CommonJS', 'static vs dynamic import', 'tree shaking', 'circular dependency pitfalls', 'bundler basics', 'top-level await'] },
  { id: 'patterns',   num: '09 — ADVANCED',    group: 'ADVANCED',    title: 'Patterns & Functional Techniques',topics: ['module pattern', 'observer/pub-sub', 'debounce vs throttle implementation', 'memoization', 'factory vs constructor', 'immutability patterns'] },
  { id: 'memory',     num: '10 — ADVANCED',    group: 'ADVANCED',    title: 'Memory Management & Performance', topics: ['garbage collection (mark-and-sweep)', 'memory leaks: common causes', 'closure-based leaks', 'WeakMap for private data', 'performance.now and profiling', 'V8 hidden classes'] },
];

const BLOCK_SCHEMA = `
Valid block types (return an array of these):
{ "type": "h3", "text": string }
{ "type": "p", "html": string }   -- use <code>, <strong>, <em> inline only
{ "type": "ul", "items": string[] }
{ "type": "pre", "code": string, "label": string }  -- label e.g. "JavaScript"
{ "type": "callout", "variant": "tip"|"warn"|"key"|"interview", "title": string, "body": string }
{ "type": "table", "headers": string[], "rows": string[][] }
{ "type": "quiz", "question": string, "options": string[], "answer": number, "explanation": string }
{ "type": "flashcards", "items": [{ "front": string, "back": string }] }
`.trim();

// ─── Section generation ───────────────────────────────────────────────────────

async function generateSection(
  section: typeof SECTIONS[number],
  client: OpenAI,
  model: string,
): Promise<object[]> {
  const prompt = `Generate educational content for a JavaScript interview handbook section.
Section: "${section.title}"
Key topics to cover: ${section.topics.join(', ')}

Requirements:
- 7-10 blocks total
- Start with a 2-3 sentence intro <p> block explaining the section's importance for interviews
- Cover each topic with clear explanation + at least one code example (pre block)
- Include 1 callout (tip, warn, key, or interview variant) with actionable advice
- Include 1 quiz (4 options MCQ, answer is 0-indexed)
- Include 1 flashcards block (3-5 cards) for quick recall
- Code examples must be correct, idiomatic JavaScript
- Keep explanations concise and interview-focused

${BLOCK_SCHEMA}

Return ONLY a valid JSON array of blocks. No markdown, no preamble.`;

  const resp = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: 'You are an expert JavaScript educator creating interview prep content. Return only valid JSON arrays.' },
      { role: 'user', content: prompt },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? '[]';
  const clean = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

  try {
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No array found');
    return JSON.parse(clean.slice(start, end + 1)) as object[];
  } catch {
    console.warn(`  [warn] parse failed for "${section.title}", returning empty`);
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { client, model } = buildClient();
  console.log(`\n📖 Generating JavaScript Core Handbook using ${model}\n`);

  const sections = [];
  for (const s of SECTIONS) {
    console.log(`  [${s.num}] ${s.title}`);
    const blocks = await generateSection(s, client, model);
    console.log(`    → ${blocks.length} blocks`);
    sections.push({ id: s.id, num: s.num, title: s.title, intro: '', blocks });
  }

  // Build nav with groups
  const nav = SECTIONS.map((s) => ({ id: s.id, label: s.title, group: s.group }));

  const handbook = {
    meta: {
      title: 'JavaScript Core — Interview Handbook',
      description: 'Deep-dive into JavaScript fundamentals that appear in every frontend interview: types, closures, prototypes, the event loop, promises, ES6+, and performance.',
      stats: [
        { value: '10', label: 'Core Topics' },
        { value: String(sections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === 'quiz').length, 0)), label: 'Quizzes' },
        { value: String(sections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === 'flashcards').reduce((a: number, b: any) => a + (b.items?.length ?? 0), 0), 0)), label: 'Flashcards' },
        { value: String(sections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === 'pre').length, 0)), label: 'Code Examples' },
      ],
    },
    nav,
    sections,
  };

  const outPath = join(process.cwd(), 'src/data/resources/javascript-core.json');
  writeFileSync(outPath, JSON.stringify(handbook, null, 2));
  console.log(`\n✅ ${sections.length} sections, ${sections.reduce((a, s) => a + s.blocks.length, 0)} total blocks`);
  console.log(`💾 ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
