/**
 * Finds and fixes quiz records whose question field is missing or too short
 * (e.g. "A" — clearly a generation artifact).
 * Cross-references the seed JSON files to get the correct quiz data.
 *
 * Run:  pnpm fix-bad-quiz-questions
 */

import { config as loadEnv } from 'dotenv';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_DIR = join(process.cwd(), 'prisma/seed/questions');

/** Load all seed questions into a map keyed by id */
function loadSeedMap(): Map<string, { quiz?: unknown }> {
  const map = new Map<string, { quiz?: unknown }>();
  for (const file of readdirSync(SEED_DIR).filter(f => f.endsWith('.json'))) {
    const rows = JSON.parse(readFileSync(join(SEED_DIR, file), 'utf-8')) as Array<{ id: string; quiz?: unknown }>;
    for (const r of rows) map.set(r.id, r);
  }
  return map;
}

async function main() {
  const seedMap = loadSeedMap();

  // Pull all questions with quiz data
  const all = await prisma.seedQuestion.findMany({
    where: { quiz: { not: null } },
    select: { id: true, quiz: true },
  });

  const bad: { id: string; currentQuestion: string }[] = [];
  for (const q of all) {
    try {
      const parsed = JSON.parse(q.quiz as string) as { question?: string };
      const question = parsed.question ?? '';
      if (question.length < 5) bad.push({ id: q.id, currentQuestion: question });
    } catch {
      bad.push({ id: q.id, currentQuestion: '[parse error]' });
    }
  }

  console.log(`Found ${bad.length} quiz records with bad question text`);

  let fixed = 0;
  for (const { id, currentQuestion } of bad) {
    const seed = seedMap.get(id);
    if (!seed?.quiz) {
      console.log(`  ⚠ No seed data for ${id} (current question: "${currentQuestion}") — skipping`);
      continue;
    }

    await prisma.seedQuestion.update({
      where: { id },
      data: { quiz: JSON.stringify(seed.quiz) },
    });
    const seedQuiz = seed.quiz as { question?: string };
    console.log(`  ✓ Fixed ${id}`);
    console.log(`    Was:  "${currentQuestion}"`);
    console.log(`    Now:  "${seedQuiz.question ?? '(seed has no question field)'}"`);
    fixed++;
  }

  console.log(`\n✅ Fixed ${fixed}/${bad.length} records`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
