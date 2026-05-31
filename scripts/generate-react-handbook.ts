/**
 * Generates src/data/resources/react-deep-dive.json
 *
 * Hybrid approach:
 *   - Extracts React/JS sections from resources/fun-xyz-prep.html (skipping
 *     company-specific CV/Web3 content)
 *   - Supplements with LLM-generated sections for topics not in the source
 *
 * Run:  pnpm generate-react-handbook
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });

type Provider = 'openai' | 'groq' | 'deepseek';
function buildClient(): { client: OpenAI; model: string } {
  const raw = (process.env.LLM_PROVIDER ?? 'deepseek').toLowerCase() as Provider;
  if (raw === 'groq') {
    return { client: new OpenAI({ apiKey: process.env.GROQ_API_KEY!, baseURL: 'https://api.groq.com/openai/v1' }), model: 'llama-3.3-70b-versatile' };
  }
  if (raw === 'openai') {
    return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }), model: 'gpt-4o-mini' };
  }
  return { client: new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: 'https://api.deepseek.com/v1' }), model: 'deepseek-chat' };
}

// ─── Sections ─────────────────────────────────────────────────────────────────

const GENERATED_SECTIONS = [
  { id: 'jsx',         num: '01 — FOUNDATION', group: 'FOUNDATION',  title: 'JSX, Elements & the Virtual DOM',     topics: ['JSX transpilation', 'React.createElement', 'virtual DOM concept', 'keys and reconciliation hints', 'fragments', 'portals'] },
  { id: 'hooks-core',  num: '03 — CORE HOOKS', group: 'HOOKS',       title: 'Core Hooks: useState & useReducer',    topics: ['useState internals', 'state batching', 'functional updates', 'useReducer vs useState decision tree', 'dispatching actions', 'immer pattern'] },
  { id: 'hooks-side',  num: '04 — CORE HOOKS', group: 'HOOKS',       title: 'Side Effects: useEffect & useLayoutEffect', topics: ['dependency array rules', 'cleanup functions', 'useEffect timing vs useLayoutEffect', 'fetching in effects', 'stale closure in effects', 'AbortController'] },
  { id: 'hooks-perf',  num: '05 — CORE HOOKS', group: 'HOOKS',       title: 'Performance Hooks: useMemo & useCallback', topics: ['memoization cost vs benefit', 'referential equality', 'when NOT to memoize', 'useCallback for stable references', 'React.memo', 'memo + callback anti-patterns'] },
  { id: 'context',     num: '07 — PATTERNS',   group: 'PATTERNS',    title: 'Context API & State Management',       topics: ['Context vs prop drilling', 're-render scope of context', 'splitting contexts', 'Context + useReducer pattern', 'when to use Zustand/Redux instead', 'selector pattern'] },
  { id: 'custom-hooks',num: '08 — PATTERNS',   group: 'PATTERNS',    title: 'Custom Hooks & Composition',           topics: ['rules of hooks', 'extracting stateful logic', 'useDebounce', 'useFetch', 'useLocalStorage', 'testing custom hooks'] },
  { id: 'server-comp', num: '10 — ADVANCED',   group: 'ADVANCED',    title: 'Server Components & Suspense',         topics: ['RSC vs RCC boundary', 'server-side data fetching', 'Suspense for async', 'streaming', 'use() hook', 'common migration mistakes'] },
];

// Sections extracted from fun-xyz-prep.html (in order they appear)
const SOURCE_SECTION_IDS = ['reconciliation', 'list-perf'];

const BLOCK_SCHEMA = `
Valid block types:
{ "type": "h3", "text": string }
{ "type": "p", "html": string }
{ "type": "ul", "items": string[] }
{ "type": "pre", "code": string, "label": string }
{ "type": "callout", "variant": "tip"|"warn"|"key"|"interview", "title": string, "body": string }
{ "type": "table", "headers": string[], "rows": string[][] }
{ "type": "quiz", "question": string, "options": string[], "answer": number, "explanation": string }
{ "type": "flashcards", "items": [{ "front": string, "back": string }] }
`.trim();

// ─── Extract source sections from fun-xyz-prep.html ───────────────────────────

function extractSourceSections(client: OpenAI, model: string) {
  const html = readFileSync(
    join(process.cwd(), 'resources/fun-xyz-prep.html'),
    'utf-8',
  );
  const $ = cheerio.load(html);

  // The reconciliation and list-perf content lives after the React heading
  // We'll extract by text proximity to key headings
  const sections: Array<{ id: string; title: string; rawText: string }> = [];

  // Find all h2/h3 headings that match our target sections
  const targets = [
    { id: 'reconciliation', keywords: ['Reconciliation', 'Fiber'] },
    { id: 'list-perf',      keywords: ['List Performance', '10K', 'Virtuali'] },
  ];

  $('h2, h3, h4').each((_, el) => {
    const text = $(el).text().trim();
    for (const target of targets) {
      if (target.keywords.some((k) => text.includes(k))) {
        // Collect text from this heading until the next heading of same/higher level
        const tagName = el.tagName;
        let content = text + '\n';
        let next = $(el).next();
        while (next.length && !next.is('h2, h3, h4')) {
          content += next.text().trim() + '\n';
          next = next.next();
        }
        if (content.length > 100) {
          sections.push({ id: target.id, title: text.replace(/[^\w\s]/g, '').trim(), rawText: content.slice(0, 3000) });
        }
      }
    }
  });

  return sections;
}

// ─── Convert raw text to blocks via LLM ──────────────────────────────────────

async function rawTextToBlocks(
  title: string,
  rawText: string,
  client: OpenAI,
  model: string,
): Promise<object[]> {
  const resp = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 2500,
    messages: [
      { role: 'system', content: 'Convert raw content into a structured JSON array of blocks for a React interview handbook. Return ONLY valid JSON.' },
      { role: 'user', content: `Section title: "${title}"\n\nRaw content to convert:\n${rawText}\n\n${BLOCK_SCHEMA}\n\nReturn 6-9 blocks that cover this topic well for interview prep. Add a quiz and flashcards. Return ONLY a JSON array.` },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? '[]';
  const clean = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  try {
    const s = clean.indexOf('['), e = clean.lastIndexOf(']');
    if (s === -1 || e === -1) return [];
    return JSON.parse(clean.slice(s, e + 1)) as object[];
  } catch {
    return [];
  }
}

// ─── Generate a section from scratch ─────────────────────────────────────────

async function generateSection(
  section: typeof GENERATED_SECTIONS[number],
  client: OpenAI,
  model: string,
): Promise<object[]> {
  const resp = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 2800,
    messages: [
      { role: 'system', content: 'You are an expert React educator creating interview prep content. Return only valid JSON arrays.' },
      {
        role: 'user',
        content: `Generate content for a React interview handbook section.
Section: "${section.title}"
Topics: ${section.topics.join(', ')}

Include: intro p block, h3 subsections with explanations, code examples (pre blocks), 1 callout, 1 quiz, 1 flashcards block (3-5 cards).

${BLOCK_SCHEMA}

Return ONLY a JSON array of 7-10 blocks.`,
      },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? '[]';
  const clean = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  try {
    const s = clean.indexOf('['), e = clean.lastIndexOf(']');
    if (s === -1 || e === -1) return [];
    return JSON.parse(clean.slice(s, e + 1)) as object[];
  } catch {
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { client, model } = buildClient();
  console.log(`\n⚛️  Generating React Deep Dive Handbook using ${model}\n`);

  const allSections: Array<{ id: string; num: string; title: string; intro: string; blocks: object[] }> = [];

  // 1. Generated section: JSX (section 01)
  const jsx = GENERATED_SECTIONS[0];
  console.log(`  [${jsx.num}] ${jsx.title}`);
  allSections.push({ id: jsx.id, num: jsx.num, title: jsx.title, intro: '', blocks: await generateSection(jsx, client, model) });
  console.log(`    → ${allSections[0].blocks.length} blocks`);

  // 2. Source section: Reconciliation (section 02)
  console.log('  [02 — CORE] Reconciliation & the Fiber Architecture');
  const sourceSections = extractSourceSections(client, model);
  const reconSource = sourceSections.find((s) => s.id === 'reconciliation');
  const reconBlocks = reconSource
    ? await rawTextToBlocks(reconSource.title, reconSource.rawText, client, model)
    : await generateSection({ id: 'reconciliation', num: '02', group: 'CORE', title: 'Reconciliation & Fiber Architecture', topics: ['diffing algorithm', 'fiber architecture', 'commit phase', 'double buffering', 'keys', 'shouldComponentUpdate vs memo'] }, client, model);
  allSections.push({ id: 'reconciliation', num: '02 — CORE', title: 'Reconciliation & Fiber Architecture', intro: '', blocks: reconBlocks });
  console.log(`    → ${reconBlocks.length} blocks`);

  // 3-5. Generated: hooks sections
  for (const sec of GENERATED_SECTIONS.slice(1, 4)) {
    console.log(`  [${sec.num}] ${sec.title}`);
    const blocks = await generateSection(sec, client, model);
    allSections.push({ id: sec.id, num: sec.num, title: sec.title, intro: '', blocks });
    console.log(`    → ${blocks.length} blocks`);
  }

  // 6. Source section: List performance (section 06)
  console.log('  [06 — PATTERNS] List Performance & Virtualisation');
  const listSource = sourceSections.find((s) => s.id === 'list-perf');
  const listBlocks = listSource
    ? await rawTextToBlocks(listSource.title, listSource.rawText, client, model)
    : await generateSection({ id: 'list-perf', num: '06', group: 'PATTERNS', title: 'List Performance & Virtualisation', topics: ['react-window/react-virtual', 'windowing concept', 'virtualization vs pagination', 'DOM node count', 'useDeferredValue', 'transition API'] }, client, model);
  allSections.push({ id: 'list-perf', num: '06 — PATTERNS', title: 'List Performance & Virtualisation', intro: '', blocks: listBlocks });
  console.log(`    → ${listBlocks.length} blocks`);

  // 7-9. Generated: context, custom hooks, server components
  for (const sec of GENERATED_SECTIONS.slice(4)) {
    console.log(`  [${sec.num}] ${sec.title}`);
    const blocks = await generateSection(sec, client, model);
    allSections.push({ id: sec.id, num: sec.num, title: sec.title, intro: '', blocks });
    console.log(`    → ${blocks.length} blocks`);
  }

  // 10. Generated: Testing
  console.log('  [09 — ADVANCED] Testing React Components');
  const testBlocks = await generateSection({ id: 'testing', num: '09 — ADVANCED', group: 'ADVANCED', title: 'Testing React Components', topics: ['RTL philosophy: test behaviour not implementation', 'getBy vs queryBy vs findBy', 'userEvent vs fireEvent', 'mocking hooks and context', 'async testing', 'snapshot pitfalls'] }, client, model);
  allSections.push({ id: 'testing', num: '09 — ADVANCED', title: 'Testing React Components', intro: '', blocks: testBlocks });
  console.log(`    → ${testBlocks.length} blocks`);

  const nav = allSections.map((s) => {
    const groupMap: Record<string, string> = {
      'jsx': 'FOUNDATION', 'reconciliation': 'CORE',
      'hooks-core': 'HOOKS', 'hooks-side': 'HOOKS', 'hooks-perf': 'HOOKS',
      'list-perf': 'PATTERNS', 'context': 'PATTERNS', 'custom-hooks': 'PATTERNS',
      'testing': 'ADVANCED', 'server-comp': 'ADVANCED',
    };
    return { id: s.id, label: s.title, group: groupMap[s.id] ?? 'CORE' };
  });

  const handbook = {
    meta: {
      title: 'React Deep Dive — Interview Handbook',
      description: 'Master React internals, hooks, performance patterns, and modern architecture — everything asked in senior React interviews.',
      stats: [
        { value: String(allSections.length), label: 'Core Topics' },
        { value: String(allSections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === 'quiz').length, 0)), label: 'Quizzes' },
        { value: String(allSections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === 'flashcards').reduce((a: number, b: any) => a + (b.items?.length ?? 0), 0), 0)), label: 'Flashcards' },
        { value: String(allSections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === 'pre').length, 0)), label: 'Code Examples' },
      ],
    },
    nav,
    sections: allSections,
  };

  const outPath = join(process.cwd(), 'src/data/resources/react-deep-dive.json');
  writeFileSync(outPath, JSON.stringify(handbook, null, 2));
  console.log(`\n✅ ${allSections.length} sections, ${allSections.reduce((a, s) => a + s.blocks.length, 0)} total blocks`);
  console.log(`💾 ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
