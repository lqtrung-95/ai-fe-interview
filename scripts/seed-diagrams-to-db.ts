/**
 * Applies hand-crafted SVG diagrams from diagram-library.ts to matching seed
 * questions already in the database.
 *
 * Matching: tests matchPattern against the question text ONLY (not topic/subtopic)
 * to avoid false positives where a subtopic like "Event loop" drags the event-loop
 * SVG onto questions that aren't about the event loop at all.
 *
 * Usage: pnpm seed:diagrams
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { DIAGRAMS } from './diagram-library';

loadEnv({ path: '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL missing in .env.local');

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const questions = await prisma.seedQuestion.findMany({
      select: { id: true, question: true, topic: true, subtopic: true },
    });

    // Note: we do NOT clear all diagramSvg here — pnpm seed already writes
    // LLM-generated SVGs for every question. We only override the specific
    // questions that have a hand-crafted diagram entry in diagram-library.ts.
    console.log(`\n▶ Matching diagrams to ${questions.length} questions…\n`);

    let applied = 0;
    const byDiagram: Record<string, string[]> = {};

    for (const q of questions) {
      // Match on question text only — including topic/subtopic caused too many false
      // positives (e.g. a pagination question with subtopic "event loop" getting the
      // event-loop SVG instead of its Mermaid diagram).
      const match = DIAGRAMS.find((d) => d.matchPattern.test(q.question));
      if (!match) continue;

      await prisma.seedQuestion.update({
        where: { id: q.id },
        data: { diagramSvg: match.svg },
      });

      byDiagram[match.concept] ??= [];
      byDiagram[match.concept].push(q.question.slice(0, 60));
      applied++;
    }

    // Print summary grouped by concept
    for (const [concept, qs] of Object.entries(byDiagram)) {
      console.log(`  ${concept} (${qs.length})`);
      qs.forEach((q) => console.log(`    · ${q}`));
    }

    console.log(`\n✓ Applied diagrams to ${applied} questions.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
