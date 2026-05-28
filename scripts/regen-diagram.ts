/**
 * Regenerates the Mermaid diagram for one or more specific questions.
 *
 * Usage:
 *   pnpm regen-diagram "<search>"        — matches questions containing the text
 *   pnpm regen-diagram --id <exact-id>   — matches a single question by exact ID
 *
 * Examples:
 *   LLM_PROVIDER=openai pnpm regen-diagram "event loop"
 *   LLM_PROVIDER=openai pnpm regen-diagram --id "fe-prep-2-event-loop-explain-how"
 *
 * The script:
 *  1. Finds matching questions in prisma/seed/questions/*.json
 *  2. Calls the LLM (respects LLM_PROVIDER env) for a new diagramMermaid
 *  3. Updates the JSON file on disk
 *  4. Upserts the new diagram straight into the DB (no full re-seed needed)
 */

import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import OpenAI from 'openai';

loadEnv({ path: '.env.local' });

const SEED_DIR = 'prisma/seed/questions';

// ── Inline LLM setup (mirrors extract-seed-llm-helpers.ts) ──────────────────

type Provider = 'openai' | 'groq' | 'deepseek';
function getProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (raw === 'groq' || raw === 'deepseek') return raw;
  return 'openai';
}

interface ProviderConfig { apiKey: string; baseURL?: string; model: string; }
function getConfig(): ProviderConfig {
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

interface SeedRow {
  id: string;
  question: string;
  topic: string;
  subtopic?: string | null;
  diagramMermaid?: string | null;
  [key: string]: unknown;
}

async function generateDiagram(question: string, topic: string): Promise<string | null> {
  const cfg = getConfig();
  const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });

  console.log(`  [llm] calling ${getProvider()} / ${cfg.model} …`);
  const r = await client.chat.completions.create({
    model: cfg.model,
    response_format: { type: 'json_object' },
    max_tokens: 400,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior frontend engineer creating educational Mermaid diagrams. ' +
          'Given a frontend interview question, produce a Mermaid flowchart that visually ' +
          'explains the core concept being asked. Rules:\n' +
          '- Use "flowchart LR" or "flowchart TD" syntax\n' +
          '- 4-9 nodes, each label ≤5 words\n' +
          '- Arrows show data flow or cause-effect relationships\n' +
          '- Use subgraph for logically grouped nodes when it aids clarity\n' +
          '- English labels only, no markdown inside labels\n' +
          '- Output raw Mermaid source (no ```mermaid fences)\n' +
          'Return JSON: { "diagram": "<mermaid source>" }',
      },
      {
        role: 'user',
        content: `Topic: ${topic}\nQuestion: ${question}`,
      },
    ],
  });

  const raw = r.choices[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw) as { diagram?: string };
    return parsed.diagram?.trim() || null;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: pnpm regen-diagram "<search text>"');
    console.error('       pnpm regen-diagram --id <exact-id>');
    process.exit(1);
  }

  const byId = args[0] === '--id';
  const query = byId ? args[1] : args.join(' ');
  if (!query) {
    console.error('Missing search query or id.');
    process.exit(1);
  }

  // ── Find matching questions ──────────────────────────────────────────────
  const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  const matches: { filePath: string; fileData: SeedRow[]; rowIdx: number; row: SeedRow }[] = [];

  for (const file of files) {
    const filePath = join(SEED_DIR, file);
    const data: SeedRow[] = JSON.parse(readFileSync(filePath, 'utf8'));
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const hit = byId
        ? row.id === query
        : row.question.toLowerCase().includes(query.toLowerCase());
      if (hit) matches.push({ filePath, fileData: data, rowIdx: i, row });
    }
  }

  if (matches.length === 0) {
    console.log(`No questions matched "${query}".`);
    process.exit(0);
  }

  console.log(`\nFound ${matches.length} matching question(s):\n`);
  matches.forEach((m, i) => console.log(`  ${i + 1}. [${m.row.id}]\n     ${m.row.question.slice(0, 80)}\n`));

  // ── Connect to DB ─────────────────────────────────────────────────────────
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL missing in .env.local');
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  let updated = 0;
  // Track which files were changed so we write them once at the end
  const changedFiles = new Map<string, SeedRow[]>();

  try {
    for (const { filePath, fileData, rowIdx, row } of matches) {
      console.log(`\n── ${row.question.slice(0, 70)} ──`);

      const diagram = await generateDiagram(row.question, row.topic);
      if (!diagram) {
        console.log('  ✗ LLM returned empty diagram — skipped.');
        continue;
      }

      console.log('  New diagram:');
      diagram.split('\n').forEach((l) => console.log(`    ${l}`));

      // Update in-memory data
      fileData[rowIdx] = { ...row, diagramMermaid: diagram };
      changedFiles.set(filePath, fileData);

      // Update DB directly
      await prisma.seedQuestion.update({
        where: { id: row.id },
        data: { diagramMermaid: diagram },
      });

      updated++;
      console.log(`  ✓ Updated in DB`);
    }

    // Write changed JSON files
    for (const [fp, data] of changedFiles) {
      writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
      console.log(`\n  ✓ Saved ${fp}`);
    }

    console.log(`\n✓ Regenerated diagrams for ${updated}/${matches.length} questions.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('\n✗ Failed:', e.message ?? e);
  process.exit(1);
});
