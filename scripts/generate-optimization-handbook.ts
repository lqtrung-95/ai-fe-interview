/**
 * Generates src/data/resources/optimization-deep-dive.json
 *
 * A staff-level frontend performance optimization handbook, organized by
 * use case. 17 sections across 6 groups. Every section emphasises:
 *   - measure-first methodology
 *   - decision tables (when to use X vs Y)
 *   - trade-offs and "when NOT to optimize"
 *   - concrete metrics (16ms frame, <200ms INP, <2.5s LCP, <0.1 CLS)
 *   - the "interview signal" — what staff engineers say that juniors don't
 *
 * Run:  pnpm generate-optimization-handbook
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
    return { client: new OpenAI({ apiKey: process.env.GROQ_API_KEY!, baseURL: 'https://api.groq.com/openai/v1' }), model: 'llama-3.3-70b-versatile' };
  }
  if (raw === 'openai') {
    return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }), model: 'gpt-4o-mini' };
  }
  return { client: new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: 'https://api.deepseek.com/v1' }), model: 'deepseek-chat' };
}

// ─── Section definitions ──────────────────────────────────────────────────────
// Each section is framed as a use case: "I have problem X → these techniques."

const SECTIONS = [
  // ◆ DIAGNOSE FIRST
  {
    id: 'measure', num: '01 — DIAGNOSE', group: 'DIAGNOSE',
    title: 'Measurement & Profiling',
    useCase: 'Before optimizing anything: how to find the real bottleneck.',
    topics: [
      'Core Web Vitals: LCP (<2.5s), INP (<200ms), CLS (<0.1), plus TTFB and FCP',
      'Lab data (Lighthouse) vs field data (RUM / Chrome UX Report) — why they disagree',
      'Chrome DevTools Performance panel: flame charts, long tasks, the main thread',
      'performance budgets and CI gates (bundlesize, Lighthouse CI)',
      'the measure → optimize → verify loop; avoiding premature optimization',
      'user-centric metrics vs vanity metrics',
    ],
  },
  // ◆ LOADING
  {
    id: 'bundle', num: '02 — LOADING', group: 'LOADING',
    title: 'Bundle Size & Code Splitting',
    useCase: 'My JS bundle is too large and slow to download/parse.',
    topics: [
      'bundle analysis (source-map-explorer, webpack-bundle-analyzer)',
      'tree shaking and the sideEffects flag',
      'dynamic import() and route-based vs component-based splitting',
      'React.lazy + Suspense for component splitting',
      'barrel-file (index.ts re-export) pitfalls that break tree shaking',
      'vendor chunking and shared chunks',
    ],
  },
  {
    id: 'buildtool', num: '03 — LOADING', group: 'LOADING',
    title: 'Build Tooling & Chunking',
    useCase: 'How the bundler choices affect load and cache performance.',
    topics: [
      'webpack vs Vite vs esbuild vs Rollup — speed and output trade-offs',
      'chunk splitting strategy (splitChunks, manualChunks)',
      'long-term caching with content-hash filenames',
      'Module Federation for micro-frontends',
      'persistent / incremental build caching',
      'minification: Terser vs esbuild vs SWC',
    ],
  },
  {
    id: 'assets', num: '04 — LOADING', group: 'LOADING',
    title: 'Image & Font Optimization',
    useCase: 'Images and fonts dominate my page weight and cause layout shift.',
    topics: [
      'modern image formats (AVIF, WebP) and fallbacks',
      'responsive images: srcset, sizes, the picture element',
      'lazy loading: loading="lazy" and IntersectionObserver',
      'CLS prevention with width/height or aspect-ratio',
      'font subsetting, font-display (swap/optional), preloading critical fonts',
      'FOUT vs FOIT, variable fonts',
    ],
  },
  {
    id: 'crp', num: '05 — LOADING', group: 'LOADING',
    title: 'Critical Rendering Path',
    useCase: 'The browser is blocked from painting above-the-fold content.',
    topics: [
      'critical CSS extraction and inlining',
      'render-blocking CSS and JS',
      'defer vs async script loading',
      'resource hints: preload, prefetch, preconnect, dns-prefetch, modulepreload',
      'priority hints (fetchpriority) and above-the-fold prioritization',
      'eliminating render-blocking requests',
    ],
  },
  {
    id: 'thirdparty', num: '06 — LOADING', group: 'LOADING',
    title: 'Third-Party Scripts',
    useCase: 'Analytics, tags, and widgets are tanking my performance.',
    topics: [
      'the real cost of analytics, tag managers, chat widgets',
      'facade pattern: load heavy embeds only on interaction',
      'async/defer for third-party scripts',
      'offloading to a web worker (Partytown)',
      'script prioritization and self-hosting vs CDN',
      'measuring third-party impact in DevTools',
    ],
  },
  // ◆ RUNTIME
  {
    id: 'rendering', num: '07 — RUNTIME', group: 'RUNTIME',
    title: 'Rendering & Paint Performance',
    useCase: 'My UI janks, drops frames, or stutters during interaction.',
    topics: [
      'reflow vs repaint vs composite — the pixel pipeline',
      'layout thrashing and read-then-write batching (FastDOM pattern)',
      'the compositor thread and GPU-accelerated properties',
      'animating transform/opacity instead of layout properties',
      'will-change and its cost (layer explosion)',
      'content-visibility and CSS containment; the 16ms frame budget',
    ],
  },
  {
    id: 'css', num: '08 — RUNTIME', group: 'RUNTIME',
    title: 'CSS Performance',
    useCase: 'CSS itself is slow — selectors, runtime styles, or layout cost.',
    topics: [
      'selector matching cost and complexity',
      'CSS-in-JS runtime cost (styled-components) vs zero-runtime (vanilla-extract, Tailwind)',
      'CSS containment (contain) for isolating layout/paint',
      'GPU layer promotion and avoiding layer explosion',
      'unused CSS removal (PurgeCSS, content-aware Tailwind)',
      'container queries cost vs media queries',
    ],
  },
  {
    id: 'lists', num: '09 — RUNTIME', group: 'RUNTIME',
    title: 'Large Lists & Heavy DOM',
    useCase: 'Rendering thousands of rows freezes the page.',
    topics: [
      'virtualization / windowing (react-window, TanStack Virtual)',
      'windowing vs pagination vs infinite scroll — decision matrix',
      'DOM node count budget and its impact',
      'fixed vs variable row heights in virtualization',
      'content-visibility: auto for long static pages',
      'recycling DOM nodes',
    ],
  },
  {
    id: 'concurrency', num: '10 — RUNTIME', group: 'RUNTIME',
    title: 'Main Thread & Concurrency',
    useCase: 'Heavy computation blocks the main thread and freezes the UI.',
    topics: [
      'Web Workers: when and how to offload',
      'debounce vs throttle — implementation and when to use each',
      'requestIdleCallback for low-priority work',
      'time-slicing long tasks (the 50ms long-task threshold)',
      'scheduler.postTask and yielding to the main thread',
      'OffscreenCanvas and SharedArrayBuffer',
    ],
  },
  // ◆ REACT
  {
    id: 'react-render', num: '11 — REACT', group: 'REACT',
    title: 'React Re-render Optimization',
    useCase: 'My React app re-renders too much and feels sluggish.',
    topics: [
      'React.memo and when memoization actually hurts',
      'useMemo / useCallback cost-benefit and referential equality',
      'state colocation and pushing state down',
      'context splitting and selector patterns to limit re-renders',
      'key stability and reconciliation',
      'why you usually DON\'T need to memoize; the React Compiler; DevTools Profiler',
    ],
  },
  {
    id: 'react-concurrent', num: '12 — REACT', group: 'REACT',
    title: 'React Concurrent & Loading',
    useCase: 'I want responsive UI during expensive updates and data loads.',
    topics: [
      'Suspense for code and data',
      'React.lazy for code splitting',
      'useTransition for non-urgent updates',
      'useDeferredValue for expensive derived UI',
      'concurrent rendering, interruption, and startTransition',
      'the tearing problem and useSyncExternalStore',
    ],
  },
  {
    id: 'ssr-hydration', num: '13 — REACT', group: 'REACT',
    title: 'SSR & Hydration Cost',
    useCase: 'Server rendering helps TTFB but hydration delays interactivity.',
    topics: [
      'the hydration tax and why TTI lags behind FCP',
      'streaming SSR and progressive hydration',
      'selective hydration and islands architecture',
      'React Server Components as a hydration-reduction strategy',
      'partial hydration and resumability (Qwik) — the spectrum',
      'measuring hydration cost',
    ],
  },
  // ◆ NETWORK & DATA
  {
    id: 'network', num: '14 — NETWORK & DATA', group: 'NETWORK & DATA',
    title: 'Network & Caching',
    useCase: 'Requests are slow or there are too many round-trips.',
    topics: [
      'HTTP caching: Cache-Control, ETag, max-age, immutable, stale-while-revalidate',
      'CDN and edge caching',
      'HTTP/2 multiplexing (and why server push was deprecated)',
      'HTTP/3 / QUIC benefits',
      'compression: Brotli vs gzip',
      'connection reuse and the cache hierarchy',
    ],
  },
  {
    id: 'data', num: '15 — NETWORK & DATA', group: 'NETWORK & DATA',
    title: 'Data Fetching Optimization',
    useCase: 'My data layer over-fetches, waterfalls, or refetches needlessly.',
    topics: [
      'client cache with React Query / SWR (stale-while-revalidate)',
      'prefetching and preloading data on intent',
      'request deduplication',
      'eliminating over-fetching (GraphQL field selection, REST sparse fieldsets)',
      'cursor vs offset pagination',
      'optimistic updates, normalized caching, and waterfall elimination',
    ],
  },
  // ◆ PERCEIVED & SUSTAINED
  {
    id: 'perceived', num: '16 — PERCEIVED & MEMORY', group: 'PERCEIVED & MEMORY',
    title: 'Perceived Performance',
    useCase: 'It feels slow even when the metrics look fine.',
    topics: [
      'skeleton screens vs spinners',
      'optimistic UI for instant feedback',
      'progressive and streaming loading',
      'instant feedback under 100ms; the loading hierarchy',
      'perceived vs actual performance (occupied vs unoccupied time)',
      'predictive prefetch on hover/intent',
    ],
  },
  {
    id: 'memory', num: '17 — PERCEIVED & MEMORY', group: 'PERCEIVED & MEMORY',
    title: 'Memory Optimization',
    useCase: 'Memory grows over time in my long-lived SPA.',
    topics: [
      'leak sources: event listeners, timers, closures, detached DOM, global caches',
      'garbage collection (mark-and-sweep, generational)',
      'WeakMap / WeakSet / WeakRef for collectable references',
      'heap snapshots and allocation profiling in DevTools',
      'detecting detached DOM nodes',
      'object pooling and memory in single-page apps',
    ],
  },
];

const BLOCK_SCHEMA = `
Valid block types (return an array of these):
{ "type": "h3", "text": string }
{ "type": "p", "html": string }   -- inline <code>, <strong>, <em> only
{ "type": "ul", "items": string[] }
{ "type": "pre", "code": string, "label": string }  -- label e.g. "JavaScript", "CSS", "Bash"
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
  const prompt = `Generate STAFF-LEVEL educational content for a frontend performance optimization handbook section.

Section: "${section.title}"
Use case it solves: "${section.useCase}"
Key topics to cover: ${section.topics.join('; ')}

This handbook is for SENIOR and STAFF engineers preparing for interviews. The reader knows the basics.
What separates a staff answer from a junior answer is TRADE-OFFS and JUDGEMENT, not a list of techniques.

Requirements (8-12 blocks total):
- Start with a <p> intro framing the use case and why it matters at scale (2-3 sentences).
- Cover each topic with a concrete explanation. Include at least 2 code examples (pre blocks) where code is relevant — real, idiomatic, copy-pasteable.
- Include at least 1 "table" block as a DECISION MATRIX (e.g. "When to use X vs Y", or technique comparison with columns like Technique / Best for / Cost / Avoid when).
- Include exactly 1 callout with variant "interview" titled with the senior signal — what a staff engineer says that a junior doesn't (e.g. "always measure first", "this is premature below N items").
- Include at least 1 callout with variant "warn" about a common mistake or "when NOT to use this optimization" (premature optimization, the cost of the technique).
- Use CONCRETE METRICS wherever relevant: 16ms frame budget, <200ms INP, <2.5s LCP, <0.1 CLS, 50ms long-task threshold, specific kB/ms numbers.
- Include exactly 1 quiz (4 options MCQ, "answer" is 0-indexed) that tests JUDGEMENT, not recall.
- Include exactly 1 flashcards block (4-5 cards) for quick recall.
- Be direct and specific. No filler. No "it depends" without explaining what it depends ON.

${BLOCK_SCHEMA}

Return ONLY a valid JSON array of blocks. No markdown fences, no preamble.`;

  const resp = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 3800,
    messages: [
      { role: 'system', content: 'You are a staff frontend engineer and performance expert creating senior-level interview prep content. You emphasise trade-offs, measurement, and judgement. Return only valid JSON arrays.' },
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
  console.log(`\n⚡ Generating Optimization Deep Dive Handbook using ${model}\n`);

  const sections = [];
  for (const s of SECTIONS) {
    console.log(`  [${s.num}] ${s.title}`);
    const blocks = await generateSection(s, client, model);
    console.log(`    → ${blocks.length} blocks`);
    sections.push({ id: s.id, num: s.num, title: s.title, intro: '', blocks });
  }

  const nav = SECTIONS.map((s) => ({ id: s.id, label: s.title, group: s.group }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countBlocks = (type: string) => sections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === type).length, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countFlashcards = () => sections.reduce((acc, s) => acc + s.blocks.filter((b: any) => b.type === 'flashcards').reduce((a: number, b: any) => a + (b.items?.length ?? 0), 0), 0);

  const handbook = {
    meta: {
      title: 'Optimization Deep Dive — Staff-Level Performance Handbook',
      description: 'Every frontend performance technique organized by use case — from measurement and bundle size to rendering, React internals, network, and memory. Each with its trade-offs and when NOT to use it.',
      stats: [
        { value: String(sections.length), label: 'Use Cases' },
        { value: String(countBlocks('quiz')), label: 'Quizzes' },
        { value: String(countFlashcards()), label: 'Flashcards' },
        { value: String(countBlocks('table')), label: 'Decision Tables' },
      ],
    },
    nav,
    sections,
  };

  const outPath = join(process.cwd(), 'src/data/resources/optimization-deep-dive.json');
  writeFileSync(outPath, JSON.stringify(handbook, null, 2));
  console.log(`\n✅ ${sections.length} sections, ${sections.reduce((a, s) => a + s.blocks.length, 0)} total blocks`);
  console.log(`💾 ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
