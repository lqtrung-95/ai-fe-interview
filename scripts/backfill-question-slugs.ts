/**
 * Backfill: assign a unique kebab-case slug to every SeedQuestion row that
 * doesn't have one yet. Rows with an existing slug are never touched
 * (URL permanence). Safe to re-run.
 *
 * Usage: pnpm exec tsx scripts/backfill-question-slugs.ts
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { uniqueQuestionSlug } from '../src/lib/seo/slugify-question';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const rows = await prisma.seedQuestion.findMany({
    select: { id: true, question: true, slug: true },
    // Deterministic order so re-runs against a partially slugged table
    // resolve collisions the same way.
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  const taken = new Set<string>(rows.flatMap((r) => (r.slug ? [r.slug] : [])));
  let updated = 0;
  for (const row of rows) {
    if (row.slug) continue;
    const slug = uniqueQuestionSlug(row.question, taken);
    await prisma.seedQuestion.update({ where: { id: row.id }, data: { slug } });
    updated++;
  }

  const [check] = await prisma.$queryRawUnsafe<
    Array<{ total: number; slugged: number; distinctSlugs: number }>
  >(
    'SELECT count(*)::int AS "total", count(slug)::int AS "slugged", count(DISTINCT slug)::int AS "distinctSlugs" FROM "SeedQuestion"',
  );
  console.log(`✓ ${updated} slugs assigned.`, check);

  if (check.total !== check.slugged || check.slugged !== check.distinctSlugs) {
    console.error('✗ Slug coverage/uniqueness check FAILED');
    process.exit(1);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
