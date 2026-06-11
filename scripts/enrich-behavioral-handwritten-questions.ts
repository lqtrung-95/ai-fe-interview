/**
 * Backfills study content (childExplanation, detailedExplanation, quiz) for
 * the original hand-written behavioral rows in behavioral.json that predate
 * the content pipeline — the 8 pages currently noindex'd as thin.
 *
 * Preserves question text, expectedPoints, followUps, id, and sourceFile.
 * Only rows missing childExplanation are touched. Safe to re-run.
 *
 * DO NOT run concurrently with generate-new-questions.ts — both rewrite
 * behavioral.json and the last writer wins.
 *
 * Usage:
 *   pnpm exec tsx scripts/enrich-behavioral-handwritten-questions.ts [--dry-run]
 */

import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import OpenAI from 'openai';
import { buildBehavioralSystemPrompt } from './behavioral-content-prompt';

loadEnv({ path: '.env.local' });

const FILE = 'prisma/seed/questions/behavioral.json';
const DELAY_MS = 1500;
const DRY_RUN = process.argv.includes('--dry-run');

interface BehavioralRow {
  id: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  question: string;
  expectedPoints: string[];
  followUps: string[];
  tags: string[];
  childExplanation?: string | null;
  detailedExplanation?: string | null;
  quiz?: string | null;
  [key: string]: unknown;
}

function getLLMConfig() {
  const p = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (p === 'deepseek') {
    const k = process.env.DEEPSEEK_API_KEY;
    if (!k || k === 'placeholder') throw new Error('DEEPSEEK_API_KEY missing');
    return { apiKey: k, baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' };
  }
  const k = process.env.OPENAI_API_KEY;
  if (!k || k === 'placeholder') throw new Error('OPENAI_API_KEY missing');
  return { apiKey: k, baseURL: undefined, model: 'gpt-4o' };
}

/** Escape literal control chars inside JSON string values (DeepSeek quirk). */
function sanitizeJsonControlChars(raw: string): string {
  let inStr = false;
  let escaped = false;
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const code = raw.charCodeAt(i);
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
  return out;
}

async function main() {
  const cfg = getLLMConfig();
  const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });

  const rows: BehavioralRow[] = JSON.parse(readFileSync(FILE, 'utf8'));
  const targets = rows.filter((r) => !r.childExplanation);
  console.log(`\n▶ Enriching ${targets.length} hand-written behavioral rows (${cfg.model})\n`);

  let prisma: PrismaClient | null = null;
  if (!DRY_RUN) {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  let done = 0;
  let failed = 0;
  for (const row of targets) {
    const prefix = createHash('md5').update(row.id).digest('hex').slice(0, 6);
    console.log(`- ${row.id}`);
    if (DRY_RUN) { console.log('  [dry-run]'); continue; }

    try {
      const res = await client.chat.completions.create({
        model: cfg.model,
        response_format: { type: 'json_object' },
        max_tokens: 5000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: buildBehavioralSystemPrompt() },
          {
            role: 'user',
            content: `Generate content for this behavioral interview question:

Topic: ${row.topic}
Subtopic: ${row.subtopic ?? ''}
Difficulty: ${row.difficulty}
Question: ${row.question}

Use lq-${prefix}-0 through lq-${prefix}-4 for the 5 ladder item IDs.

Return ONLY the JSON object with keys: childExplanation, detailedExplanation, expectedPoints, followUps, quiz`,
          },
        ],
      });

      const raw = res.choices[0]?.message?.content?.trim() ?? '';
      const parsed = JSON.parse(sanitizeJsonControlChars(raw));
      const ladders = (String(parsed.detailedExplanation).match(/lq-item/g) ?? []).length;
      if (!parsed.childExplanation || !parsed.detailedExplanation || ladders < 5 || !parsed.quiz) {
        console.log(`  ✗ invalid content (ladders=${ladders})`);
        failed++;
        continue;
      }

      // Fill missing fields only — hand-written question/expectedPoints stay.
      row.childExplanation = parsed.childExplanation;
      row.detailedExplanation = parsed.detailedExplanation;
      row.quiz = JSON.stringify(parsed.quiz);
      if (!row.followUps || row.followUps.length < 3) row.followUps = parsed.followUps;
      if (!row.tags || row.tags.length === 0) {
        row.tags = ['behavioral', 'star-method', 'communication'];
      }

      writeFileSync(FILE, JSON.stringify(rows, null, 2) + '\n');
      await prisma!.seedQuestion.update({
        where: { id: row.id },
        data: {
          childExplanation: row.childExplanation,
          detailedExplanation: row.detailedExplanation,
          quiz: row.quiz,
          followUps: row.followUps,
          tags: row.tags,
        },
      });
      console.log(`  ✓ ${String(parsed.detailedExplanation).length} chars`);
      done++;
    } catch (err) {
      console.log(`  ✗ ${(err as Error).message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  if (prisma) await prisma.$disconnect();
  console.log(`\n✓ Enriched ${done}, failed ${failed} of ${targets.length}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
