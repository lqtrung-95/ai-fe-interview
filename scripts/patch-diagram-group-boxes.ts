/**
 * Removes orphaned dg-grp (group box) rects from seed question SVGs in the database.
 * These boxes were generated for partial node groups and looked visually broken.
 *
 * Targets the two CORS questions that had a "CORS FLOW" / "CORS PROCESS" box
 * that only wrapped a subset of nodes, leaving other nodes floating outside.
 *
 * Run:  pnpm patch-diagram-groups
 */

import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function removeDgGrp(svg: string): Promise<string> {
  return svg
    .replace(/\s*<rect[^>]+class="dg-grp"[^>]*\/>\s*/g, '\n  ')
    .replace(/\s*<text[^>]*>CORS (?:FLOW|PROCESS)<\/text>\s*/g, '\n  ');
}

async function main() {
  // Find all DB questions whose SVG contains a CORS group box
  const affected = await prisma.seedQuestion.findMany({
    where: {
      diagramSvg: { contains: 'class="dg-grp"' },
    },
    select: { id: true, diagramSvg: true },
  });

  console.log(`Found ${affected.length} questions with dg-grp boxes`);

  let updated = 0;
  for (const q of affected) {
    if (!q.diagramSvg) continue;
    const fixed = await removeDgGrp(q.diagramSvg);
    if (fixed === q.diagramSvg) { console.log(`  ~ No change: ${q.id}`); continue; }

    await prisma.seedQuestion.update({
      where: { id: q.id },
      data: { diagramSvg: fixed },
    });
    console.log(`  ✓ Fixed: ${q.id}`);
    updated++;
  }

  console.log(`\n✅ Patched ${updated} records`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
