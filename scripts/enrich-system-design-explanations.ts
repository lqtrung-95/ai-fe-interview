/**
 * Enriches 3-ladder frontend system design questions with deep technical detail.
 *
 * For each question, rewrites the detailedExplanation to include:
 *   - Concrete code examples (pre/code blocks)
 *   - Specific numbers / benchmarks
 *   - Browser internals / specific APIs
 *   - 5 Deep Dive Ladder questions (up from 3), each with technical answers
 *
 * Usage:
 *   pnpm exec tsx scripts/enrich-system-design-explanations.ts
 *   pnpm exec tsx scripts/enrich-system-design-explanations.ts --dry-run
 *   pnpm exec tsx scripts/enrich-system-design-explanations.ts --filter "caching"
 *   pnpm exec tsx scripts/enrich-system-design-explanations.ts --id "fe-prep-..."
 *
 * Env:
 *   LLM_PROVIDER=openai (default) | groq | deepseek
 */

import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import OpenAI from 'openai';

loadEnv({ path: '.env.local' });

const SEED_FILE = 'prisma/seed/questions/frontend-system-design.json';
const DELAY_MS = 1500; // rate-limit pause between requests

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const filterArg = args.find((_, i, a) => a[i - 1] === '--filter') ?? null;
const idArg = args.find((_, i, a) => a[i - 1] === '--id') ?? null;

// ── LLM setup ────────────────────────────────────────────────────────────────

type Provider = 'openai' | 'groq' | 'deepseek';

function getProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (raw === 'groq' || raw === 'deepseek') return raw;
  return 'openai';
}

interface ProviderConfig { apiKey: string; baseURL?: string; model: string; }

function getLLMConfig(): ProviderConfig {
  const p = getProvider();
  if (p === 'deepseek') {
    const k = process.env.DEEPSEEK_API_KEY;
    if (!k || k === 'placeholder') throw new Error('DEEPSEEK_API_KEY missing');
    return { apiKey: k, baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' };
  }
  if (p === 'groq') {
    const k = process.env.GROQ_API_KEY;
    if (!k || k === 'placeholder') throw new Error('GROQ_API_KEY missing');
    return { apiKey: k, baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' };
  }
  const k = process.env.OPENAI_API_KEY;
  if (!k || k === 'placeholder') throw new Error('OPENAI_API_KEY missing');
  return { apiKey: k, model: 'gpt-4o' };
}

// ── Format reference (autocomplete deep-dive) ────────────────────────────────

const FORMAT_EXAMPLE = `<h4>Interview Framework</h4><p>Scope the problem: single-field search or multi-context (e.g., users, repos, files)? Backend-powered or client-side only? Max suggestions shown? Then structure your answer: <strong>input handling &#x2192; network &#x2192; cache &#x2192; rendering &#x2192; accessibility</strong>.</p><h4>Debounce — The First Layer of Defence</h4><p>Fire the API request only after the user pauses typing. Typical delay: <strong>150–300 ms</strong> (lower feels more responsive; higher saves API calls).</p><ul><li><strong>Debounce</strong>: reset the timer on every keystroke; fire once after silence. Right for search — you want the result after the user finishes a thought.</li><li><strong>Throttle</strong>: fire at most once per interval regardless of activity. Right for scroll/resize handlers, not ideal here — first keystroke waits unnecessarily.</li></ul><p>Implementation pattern with <code>useRef</code> to survive re-renders:</p><pre><code>const timer = useRef();
function handleChange(val) {
  clearTimeout(timer.current);
  timer.current = setTimeout(() =&gt; fetchSuggestions(val), 250);
}</code></pre><h4>Race Conditions — AbortController</h4><p>User types "re" (request A fires) then immediately "rea" (request B fires). If A is slower than B and arrives last, stale results overwrite fresh ones.</p><p>Fix: cancel the previous in-flight request with <code>AbortController</code>:</p><pre><code>const ctrlRef = useRef();
async function fetchSuggestions(query) {
  ctrlRef.current?.abort();
  ctrlRef.current = new AbortController();
  const res = await fetch(\`/api/suggest?q=\${query}\`, {
    signal: ctrlRef.current.signal
  });
  setSuggestions(await res.json());
}</code></pre><div class="pitfall"><span class="label">&#x26a0; Common Pitfall</span><p>Moving DOM focus into the list items breaks the input for screen readers. Instead, keep DOM focus on the input and use <code>aria-activedescendant</code> to announce the visually highlighted item.</p></div><blockquote>Senior signal: mention that autocomplete suggestions for public search boxes can be served from a <strong>CDN edge function</strong> (Cloudflare Workers, Vercel Edge) for &lt;10 ms response time globally, since the index is read-only and prefix-keyed.</blockquote><div class="ladder"><span class="label">&#x1fa9c; Deep Dive Ladder &#x2014; Self-Interview</span><p>Answer before expanding.</p><ol class="ladder-list"><li class="lq-item"><div class="lq-row"><span class="ln">1</span><span class="lq-text">Why does AbortController not fully solve race conditions — what else is needed?</span><button class="lq-toggle" data-target="lq-ac-0" aria-expanded="false">View Answer</button></div><div class="lq-ans" id="lq-ac-0" hidden=""><div class="lq-ans-inner">AbortController cancels the network request, but if two requests somehow complete simultaneously (both from cache, or via a race in microtask ordering), the last <code>setState</code> call wins. The additional guard: tag each request with an incrementing <code>requestId</code>. In the response handler, only call <code>setState</code> if <code>requestId === latestRequestId.current</code>.</div></div></li><li class="lq-item"><div class="lq-row"><span class="ln">2</span><span class="lq-text">How would you design a server-side autocomplete endpoint for sub-50 ms P99 latency?</span><button class="lq-toggle" data-target="lq-ac-1" aria-expanded="false">View Answer</button></div><div class="lq-ans" id="lq-ac-1" hidden=""><div class="lq-ans-inner">Pre-compute a sorted prefix index in Redis (ZRANGEBYLEX on a sorted set). Each key is a suggestion string with score 0; range query returns all strings between "prefix" and "prefix&#xff;". Weight results by frequency by encoding score as <code>-frequency</code>. Keep the index in RAM, respond directly from an edge function — no DB query needed.</div></div></li><li class="lq-item"><div class="lq-row"><span class="ln">3</span><span class="lq-text">How would you add fuzzy matching (typo tolerance) without a server round-trip?</span><button class="lq-toggle" data-target="lq-ac-2" aria-expanded="false">View Answer</button></div><div class="lq-ans" id="lq-ac-2" hidden=""><div class="lq-ans-inner">For small datasets (&lt;10k items): download the full list on first load and use a client-side fuzzy library (Fuse.js, minisearch) for instant offline matching. For large open-ended search: send the query to the server with <code>fuzzy=true</code>. The server uses trigram indexing (PostgreSQL <code>pg_trgm</code>, Elasticsearch) to find results within edit distance 1–2.</div></div></li><li class="lq-item"><div class="lq-row"><span class="ln">4</span><span class="lq-text">How do you track and use click-through data to improve suggestion ranking?</span><button class="lq-toggle" data-target="lq-ac-3" aria-expanded="false">View Answer</button></div><div class="lq-ans" id="lq-ac-3" hidden=""><div class="lq-ans-inner">Log events: <code>{ query, suggestionRank, selectedSuggestion, userId, sessionId, timestamp }</code>. Compute <strong>click-through rate (CTR)</strong> per suggestion per prefix. Feed CTR into the ranking model — boost suggestions with higher CTR. Track "no-result searches" to identify gaps in the index.</div></div></li><li class="lq-item"><div class="lq-row"><span class="ln">5</span><span class="lq-text">What ARIA attribute updates are needed when the suggestion list changes dynamically?</span><button class="lq-toggle" data-target="lq-ac-4" aria-expanded="false">View Answer</button></div><div class="lq-ans" id="lq-ac-4" hidden=""><div class="lq-ans-inner">When results arrive: set <code>aria-expanded="true"</code> on the combobox, update <code>aria-controls</code>, set <code>aria-setsize</code> on each option, <code>aria-posinset</code> to the item position. A visually-hidden live region with <code>aria-live="polite"</code> announces "5 suggestions available".</div></div></li></ol></div>`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ladderCount(html: string): number {
  return (html.match(/lq-item/g) ?? []).length;
}

function lqPrefix(questionId: string): string {
  return createHash('md5').update(questionId).digest('hex').slice(0, 6);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are an expert frontend engineer writing senior-level interview preparation content.
You produce rich, technically-specific HTML explanations for frontend system design questions.

RULES:
1. Return ONLY the HTML string — no markdown, no code fences, no extra text.
2. Use EXACTLY this structure:
   - Multiple <h4> sections (3-5), each covering a distinct technical subtopic
   - <p> for paragraphs, <ul><li> for bullet lists
   - <pre><code> for ALL code examples (required — must have at least 2)
   - <code> inline for API names, property names, values
   - <kbd> for keyboard shortcuts (if relevant)
   - Specific numbers: latency (ms), sizes (bytes/KB), counts — use real benchmark ranges
   - ONE <div class="pitfall"><span class="label">⚠ Common Pitfall</span><p>…</p></div>
   - ONE <blockquote> with "Senior signal:" prefix — a nuanced insight a junior would miss
   - ONE <div class="ladder"> section with EXACTLY 5 <li class="lq-item"> entries

3. Deep Dive Ladder format (CRITICAL — copy exactly):
<div class="ladder"><span class="label">🪜 Deep Dive Ladder — Self-Interview</span><p>Answer before expanding.</p><ol class="ladder-list">
<li class="lq-item"><div class="lq-row"><span class="ln">1</span><span class="lq-text">QUESTION</span><button class="lq-toggle" data-target="lq-PREFIX-0" aria-expanded="false">View Answer</button></div><div class="lq-ans" id="lq-PREFIX-0" hidden=""><div class="lq-ans-inner">ANSWER</div></div></li>
…5 items total, incrementing suffix: lq-PREFIX-0 through lq-PREFIX-4
</ol></div>

4. Ladder questions must escalate in depth:
   - Items 1-2: implementation mechanics ("how does X work internally")
   - Items 3-4: edge cases, failure modes, performance at scale
   - Item 5: system-level or cross-cutting concern (security, observability, team process)

5. Use HTML entities for special chars: > = &gt;  < = &lt;  & = &amp;  " = &quot;
   Arrow &#x2192; for flow notation. Preserve these in code blocks too.

6. Target ~7,000-9,000 characters of HTML output.`;
}

function buildUserPrompt(question: string, existingHtml: string, prefix: string): string {
  return `QUESTION: ${question}

EXISTING EXPLANATION (use as starting point — expand with far more technical depth):
${existingHtml}

FORMAT REFERENCE (match this style and depth):
${FORMAT_EXAMPLE}

IMPORTANT:
- Use lq-${prefix}-0 through lq-${prefix}-4 for the 5 ladder item IDs.
- Include at least 2 <pre><code> blocks with realistic code examples.
- Every h4 section must have concrete technical details (specific APIs, data structures, algorithms, numbers).
- Ladder answers must be dense and technically precise — 2-5 sentences each.
- Do NOT pad with vague statements. Every sentence must carry technical signal.

Return ONLY the HTML.`;
}

// ── LLM call ─────────────────────────────────────────────────────────────────

async function enrichExplanation(
  client: OpenAI,
  model: string,
  question: string,
  existingHtml: string,
  prefix: string,
): Promise<string | null> {
  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      temperature: 0.4,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(question, existingHtml, prefix) },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim() ?? '';
    if (!text) return null;

    // Strip any accidental markdown code fences
    const stripped = text
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Basic validation: must have ladder section and at least 5 lq-items
    if (!stripped.includes('lq-item') || ladderCount(stripped) < 5) {
      console.warn('  [warn] response missing 5 ladder items');
      return null;
    }
    if (!stripped.includes('<pre><code>') && !stripped.includes('<pre>\n<code>')) {
      console.warn('  [warn] response has no code examples');
    }

    return stripped;
  } catch (err) {
    console.error('  [err] LLM call failed:', (err as Error).message);
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface SeedRow {
  id: string;
  question: string;
  detailedExplanation?: string | null;
  [key: string]: unknown;
}

async function main() {
  const cfg = getLLMConfig();
  const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });

  console.log(`\n▶ Enriching system design explanations`);
  console.log(`  Provider: ${getProvider()} / ${cfg.model}`);
  if (DRY_RUN) console.log('  [DRY RUN — no writes]');
  console.log();

  // Read JSON
  const rows: SeedRow[] = JSON.parse(readFileSync(SEED_FILE, 'utf-8'));

  // Filter to 3-ladder questions
  let targets = rows.filter(
    (q) => q.detailedExplanation && ladderCount(q.detailedExplanation) === 3,
  );

  if (idArg) {
    targets = targets.filter((q) => q.id === idArg);
    if (targets.length === 0) {
      console.log(`No question found with id: ${idArg}`);
      return;
    }
  } else if (filterArg) {
    const lower = filterArg.toLowerCase();
    targets = targets.filter(
      (q) => q.question.toLowerCase().includes(lower) || q.id.toLowerCase().includes(lower),
    );
    if (targets.length === 0) {
      console.log(`No questions matched filter: "${filterArg}"`);
      return;
    }
  }

  console.log(`  ${targets.length} questions to process\n`);

  // DB connection (only if not dry run)
  let prisma: PrismaClient | null = null;
  if (!DRY_RUN) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    prisma = new PrismaClient({ adapter });
  }

  let enriched = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const q = targets[i];
    const prefix = lqPrefix(q.id);
    console.log(`[${i + 1}/${targets.length}] ${q.question.slice(0, 70)}`);
    console.log(`  ID: ${q.id}`);
    console.log(`  Prefix: lq-${prefix}`);

    if (!DRY_RUN) {
      const newHtml = await enrichExplanation(
        client,
        cfg.model,
        q.question,
        q.detailedExplanation!,
        prefix,
      );

      if (!newHtml) {
        console.log('  ✗ skipped (bad response)\n');
        failed++;
        continue;
      }

      const prevLen = q.detailedExplanation?.length ?? 0;
      const newLen = newHtml.length;

      // Update in-memory rows array
      const idx = rows.findIndex((r) => r.id === q.id);
      if (idx !== -1) rows[idx].detailedExplanation = newHtml;

      // Persist JSON after every question (incremental saves)
      writeFileSync(SEED_FILE, JSON.stringify(rows, null, 2), 'utf-8');

      // Upsert to DB
      await prisma!.seedQuestion.update({
        where: { id: q.id },
        data: { detailedExplanation: newHtml },
      });

      console.log(`  ✓ ${prevLen} → ${newLen} chars, ${ladderCount(newHtml)} ladder items\n`);
      enriched++;
    } else {
      console.log(`  [dry-run] would generate enriched explanation\n`);
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  if (prisma) await prisma.$disconnect();

  console.log(`\n✓ Done: ${enriched} enriched, ${failed} failed out of ${targets.length} targets`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
