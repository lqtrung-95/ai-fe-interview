/**
 * Idempotent seeder. Reads prisma/seed/questions/*.json and upserts
 * each row into `SeedQuestion`. Safe to run repeatedly.
 *
 * Usage: pnpm seed
 */

import { config as loadEnv } from 'dotenv';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { uniqueQuestionSlug } from '../src/lib/seo/slugify-question';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const SEED_DIR = 'prisma/seed/questions';

interface SeedRow {
  id: string;
  topic: string;
  subtopic?: string;
  difficulty: 'junior' | 'mid' | 'senior';
  type: 'conceptual' | 'debugging' | 'system_design' | 'behavioral' | 'tradeoff';
  question: string;
  expectedPoints: string[];
  followUps: string[];
  rubric: Record<string, unknown>;
  tags: string[];
  sourceFile: string;
  // Study content fields (optional — populated by extract-seed).
  childExplanation?: string;
  detailedExplanation?: string;
  diagramSvg?: string;
  diagramMermaid?: string;
  quiz?: unknown; // QuizData JSON — stored as serialised string
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let files: string[];
  try {
    files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    console.log(`No ${SEED_DIR}/ yet — run \`pnpm extract-seed\` first.`);
    await prisma.$disconnect();
    return;
  }

  if (files.length === 0) {
    console.log('No seed JSON files found.');
    await prisma.$disconnect();
    return;
  }

  // Collect all incoming IDs grouped by sourceFile so we can prune stale rows
  // (questions removed or re-IDed since the last run) per source.
  const rowsByFile = new Map<string, SeedRow[]>();
  for (const file of files) {
    const rows: SeedRow[] = JSON.parse(readFileSync(join(SEED_DIR, file), 'utf8'));
    for (const r of rows) {
      const list = rowsByFile.get(r.sourceFile) ?? [];
      list.push(r);
      rowsByFile.set(r.sourceFile, list);
    }
  }

  // Snapshot id → slug BEFORE pruning. Slugs are assigned once and never
  // changed — public /questions/[slug] URLs must stay stable across re-seeds,
  // text edits, and prune+recreate cycles (e.g. a row whose sourceFile moved).
  const preSeedRows = await prisma.seedQuestion.findMany({ select: { id: true, slug: true } });
  const slugByExistingId = new Map(preSeedRows.map((r) => [r.id, r.slug]));
  const takenSlugs = new Set(preSeedRows.flatMap((r) => (r.slug ? [r.slug] : [])));

  // Per-source prune: delete any existing rows from this sourceFile whose id
  // is no longer present in the freshly extracted JSON.
  let pruned = 0;
  for (const [sourceFile, rows] of rowsByFile) {
    // A missing sourceFile would make the findMany below unfiltered
    // (Prisma ignores `where: { sourceFile: undefined }`), flagging every
    // other row in the table as stale. Refuse to prune such groups.
    if (typeof sourceFile !== 'string' || sourceFile.length === 0) {
      console.warn(`  ⚠ ${rows.length} row(s) missing sourceFile (e.g. ${rows[0].id}) — prune skipped for them`);
      continue;
    }
    const incomingIds = new Set(rows.map((r) => r.id));
    const existing = await prisma.seedQuestion.findMany({
      where: { sourceFile },
      select: { id: true },
    });
    const toDelete = existing.filter((e) => !incomingIds.has(e.id)).map((e) => e.id);
    if (toDelete.length > 0) {
      await prisma.seedQuestion.deleteMany({ where: { id: { in: toDelete } } });
      pruned += toDelete.length;
    }
  }
  if (pruned > 0) console.log(`  − ${pruned} stale rows pruned`);

  // Rows that survived the prune keep their slug via the upsert update branch
  // (which never writes slug). Rows being (re)created reuse their pre-prune
  // slug when one existed; only genuinely new ids get a freshly derived slug.
  const survivingIds = new Set(
    (await prisma.seedQuestion.findMany({ select: { id: true } })).map((r) => r.id),
  );

  let total = 0;
  for (const file of files) {
    const rows: SeedRow[] = JSON.parse(readFileSync(join(SEED_DIR, file), 'utf8'));
    for (const r of rows) {
      const slugForNewRow = survivingIds.has(r.id)
        ? undefined
        : (slugByExistingId.get(r.id) ?? uniqueQuestionSlug(r.question, takenSlugs));
      await prisma.seedQuestion.upsert({
        where: { id: r.id },
        update: {
          topic: r.topic,
          subtopic: r.subtopic,
          difficulty: r.difficulty,
          type: r.type,
          question: r.question,
          expectedPoints: r.expectedPoints,
          followUps: r.followUps,
          rubric: r.rubric as Prisma.InputJsonValue,
          tags: r.tags,
          sourceFile: r.sourceFile,
          childExplanation: r.childExplanation ?? null,
          detailedExplanation: r.detailedExplanation ?? null,
          diagramSvg: r.diagramSvg ?? null,
          diagramMermaid: r.diagramMermaid ?? null,
          quiz: r.quiz != null ? (typeof r.quiz === 'string' ? r.quiz : JSON.stringify(r.quiz)) : null,
        },
        create: {
          id: r.id,
          slug: slugForNewRow,
          topic: r.topic,
          subtopic: r.subtopic,
          difficulty: r.difficulty,
          type: r.type,
          question: r.question,
          expectedPoints: r.expectedPoints,
          followUps: r.followUps,
          rubric: r.rubric as Prisma.InputJsonValue,
          tags: r.tags,
          sourceFile: r.sourceFile,
          childExplanation: r.childExplanation ?? null,
          detailedExplanation: r.detailedExplanation ?? null,
          diagramSvg: r.diagramSvg ?? null,
          diagramMermaid: r.diagramMermaid ?? null,
          quiz: r.quiz != null ? (typeof r.quiz === 'string' ? r.quiz : JSON.stringify(r.quiz)) : null,
        },
      });
      total++;
    }
    console.log(`  ${rows.length.toString().padStart(3)} from ${file}`);
  }
  console.log(`\n✓ Upserted ${total} seed questions across ${files.length} files.`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
