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

  let total = 0;
  for (const file of files) {
    const rows: SeedRow[] = JSON.parse(readFileSync(join(SEED_DIR, file), 'utf8'));
    for (const r of rows) {
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
        },
        create: {
          id: r.id,
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
