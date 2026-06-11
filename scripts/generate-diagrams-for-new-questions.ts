/**
 * Generates SVG diagrams for all new-prep-* questions that currently lack one.
 *
 * For each question:
 *   1. Calls the LLM to produce a DiagramSpec JSON
 *   2. Renders it via renderDiagramSpec (same renderer as all other diagrams)
 *   3. Saves diagramSvg to the seed JSON file + DB
 *
 * Usage:
 *   pnpm generate:diagrams-new
 *   pnpm generate:diagrams-new --dry-run
 *   pnpm generate:diagrams-new --id "new-prep-virtual-scrolling"
 */

import { config as loadEnv } from 'dotenv';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import OpenAI from 'openai';
import { renderDiagramSpec } from './diagram-spec-renderer';
import type { DiagramSpec } from './extract-seed-types';

loadEnv({ path: '.env.local' });

const SEED_DIR = 'prisma/seed/questions';
const DELAY_MS = 1200;

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');   // regenerate even if diagram already exists
const idArg = (() => { const i = args.indexOf('--id'); return i !== -1 ? args[i + 1] : null; })();

// ── LLM ──────────────────────────────────────────────────────────────────────

function getLLMConfig() {
  const p = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
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

// ── JSON sanitizer ────────────────────────────────────────────────────────────

function sanitizeJson(raw: string): string {
  // Fix control chars inside JSON string values
  let inStr = false, escaped = false, out = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i], code = raw.charCodeAt(i);
    if (escaped) { out += c; escaped = false; continue; }
    if (c === '\\' && inStr) { out += c; escaped = true; continue; }
    if (c === '"') { inStr = !inStr; out += c; continue; }
    if (inStr && code < 0x20) {
      if (c === '\n') out += '\\n';
      else if (c === '\r') out += '\\r';
      else if (c === '\t') out += '\\t';
      else out += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }
    out += c;
  }
  // Fix single-quoted keys/values that some models emit
  out = out.replace(/'([^']+)'(\s*:)/g, '"$1"$2');
  return out;
}

// ── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You design compact technical diagrams for frontend interview prep content.
Return ONLY a valid JSON object — no markdown, no extra text.

interface DiagramSpec {
  direction: "LR" | "TD";
  nodes: Array<{
    id: string;          // unique, lowercase, ≤2 words joined with underscore
    label: string;       // title-case, MAX 2 words (e.g. "Cache API", "Client")
    sublabel?: string;   // lowercase, MAX 3 words (e.g. "in-memory store")
    color?: "teal"|"green"|"orange"|"purple"|"red"|"blue"|"pink"|"amber"|"cyan";
  }>;
  edges: Array<{ from: string; to: string; dashed?: boolean; }>;
  groups?: Array<{
    label: string;        // MAX 2 words, describes ALL nodes in the group
    nodeIds: string[];
    color?: "teal"|"green"|"orange"|"purple"|"red"|"blue"|"pink"|"amber"|"cyan";
  }>;
  caption?: string;       // MAX 8 words
}

STRICT DIMENSION RULES — the rendered SVG must be ≤860px wide and ≤480px tall:

DIRECTION CHOICE:
  - direction="TD" is STRONGLY preferred — it scales wide topics into a compact layout.
  - Use direction="LR" ONLY for simple linear pipelines with ≤5 nodes total.
  - NEVER use direction="LR" if you have more than 5 nodes.

NODE COUNT:
  - TD: 5–9 nodes arranged in a grid (3 cols × 3 rows max).
  - LR: 3–5 nodes in a single chain.

LABEL LENGTH:
  - Node label: MAX 2 words, MAX 14 characters total.
  - Sublabel: MAX 3 words, MAX 18 characters total.
  - SHORT labels are critical — each extra character adds ~7px to node width.

GROUPS:
  - Max 2 groups. A group must describe a real sub-system, not wrap all nodes.
  - Never put all nodes in one group.

NO edge labels. Encode meaning in node sublabels.

Color guide: teal=input/client, blue=api/service, purple=core logic,
  orange=queue/buffer, green=output/success, red=error/risk,
  pink=ui/view, amber=config, cyan=transport/protocol.`;


async function generateSpec(
  client: OpenAI,
  model: string,
  question: string,
  topic: string,
): Promise<DiagramSpec | null> {
  try {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 900,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Topic: ${topic}\nQuestion: ${question}\n\nDesign a clear architectural or flow diagram that illustrates the core concept. Return ONLY the DiagramSpec JSON.`,
        },
      ],
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? '';
    if (!raw) return null;

    const spec = JSON.parse(sanitizeJson(raw)) as DiagramSpec;

    // Basic validation
    if (!spec.nodes?.length || !spec.edges?.length) {
      console.warn('  [warn] spec missing nodes or edges');
      return null;
    }
    if (spec.nodes.length > 14) {
      console.warn(`  [warn] too many nodes: ${spec.nodes.length} (max 14)`);
      // Trim to 12 nodes and filter edges
      spec.nodes = spec.nodes.slice(0, 12);
      const validIds = new Set(spec.nodes.map((n) => n.id));
      spec.edges = spec.edges.filter((e) => validIds.has(e.from) && validIds.has(e.to));
      if (spec.groups) {
        spec.groups = spec.groups
          .map((g) => ({ ...g, nodeIds: g.nodeIds.filter((id) => validIds.has(id)) }))
          .filter((g) => g.nodeIds.length > 1);
      }
    }

    return spec;
  } catch (err) {
    console.error('  [err]', (err as Error).message);
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface SeedRow {
  id: string;
  question: string;
  topic: string;
  diagramSvg?: string | null;
  diagramMermaid?: string | null;
  [key: string]: unknown;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cfg = getLLMConfig();
  const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });

  console.log(`\n▶ Generating diagrams for new-prep-* questions`);
  console.log(`  Provider: ${process.env.LLM_PROVIDER ?? 'openai'} / ${cfg.model}`);
  if (DRY_RUN) console.log('  [DRY RUN]');
  console.log();

  // Collect all new-prep questions that lack a diagram
  const targets: Array<{ row: SeedRow; file: string }> = [];

  for (const fname of readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'))) {
    const fpath = `${SEED_DIR}/${fname}`;
    const rows = JSON.parse(readFileSync(fpath, 'utf-8')) as SeedRow[];
    for (const row of rows) {
      if (!row.id.startsWith('new-prep-')) continue;
      if (row.type === 'behavioral') continue; // stories have no architecture to diagram
      if (!FORCE && (row.diagramSvg || row.diagramMermaid)) continue; // already has diagram
      if (idArg && row.id !== idArg) continue;
      targets.push({ row, file: fname });
    }
  }

  console.log(`  ${targets.length} questions need diagrams\n`);

  let prisma: PrismaClient | null = null;
  if (!DRY_RUN) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    prisma = new PrismaClient({ adapter });
  }

  let created = 0;
  let failed = 0;

  // Group by file so we can do one write per file after all its rows are processed
  const fileCache = new Map<string, SeedRow[]>();
  const loadFile = (fname: string): SeedRow[] => {
    if (!fileCache.has(fname)) {
      fileCache.set(
        fname,
        JSON.parse(readFileSync(`${SEED_DIR}/${fname}`, 'utf-8')) as SeedRow[],
      );
    }
    return fileCache.get(fname)!;
  };

  for (let i = 0; i < targets.length; i++) {
    const { row, file } = targets[i];
    console.log(`[${i + 1}/${targets.length}] ${row.question.slice(0, 68)}`);
    console.log(`  id: ${row.id}`);

    if (!DRY_RUN) {
      const spec = await generateSpec(client, cfg.model, row.question, row.topic);
      if (!spec) {
        console.log('  ✗ skipped\n');
        failed++;
        if (i < targets.length - 1) await sleep(DELAY_MS);
        continue;
      }

      const svg = renderDiagramSpec(spec);

      // Update in-memory file cache
      const rows = loadFile(file);
      const idx = rows.findIndex((r) => r.id === row.id);
      if (idx !== -1) rows[idx].diagramSvg = svg;

      // Write JSON immediately (incremental save)
      writeFileSync(`${SEED_DIR}/${file}`, JSON.stringify(rows, null, 2), 'utf-8');

      // Update DB
      await prisma!.seedQuestion.update({
        where: { id: row.id },
        data: { diagramSvg: svg },
      });

      console.log(`  ✓ SVG ${svg.length} chars — "${spec.caption ?? ''}"\n`);
      created++;
    } else {
      console.log('  [dry-run]\n');
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  if (prisma) await prisma.$disconnect();
  console.log(`\n✓ Done: ${created} diagrams generated, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
