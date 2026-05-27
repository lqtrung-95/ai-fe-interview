/**
 * One-off extraction script: turn resources/*.html into per-topic SeedQuestion JSON.
 *
 * Usage:  pnpm extract-seed
 * Output: prisma/seed/questions/{topic-slug}.json
 *
 * Caches LLM calls on disk (scripts/.translation-cache.json) — safe to re-run.
 */

import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFePrep, parseProseFile } from './extract-seed-parsers';
import { CANONICAL_TOPICS, type SeedQuestion } from './extract-seed-types';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const OUTPUT_DIR = 'prisma/seed/questions';

function topicToFilename(topic: string): string {
  return (
    topic
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.json'
  );
}

function dedupe(questions: SeedQuestion[]): SeedQuestion[] {
  // Naive dedupe by normalized question text. Good enough for an MVP seed.
  const seen = new Map<string, SeedQuestion>();
  for (const q of questions) {
    const key = q.question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 120);
    if (!seen.has(key)) seen.set(key, q);
  }
  return [...seen.values()];
}

async function main() {
  console.log('▶ Extracting seed questions from resources/*.html\n');

  const all: SeedQuestion[] = [];

  console.log('  · fe-prep.html (structured Q-bank)');
  const fePrep = await parseFePrep('resources/fe-prep.html');
  console.log(`    → ${fePrep.length} questions`);
  all.push(...fePrep);

  console.log('  · fe-prep-2.html (frontend system design guide)');
  const fePrep2 = await parseProseFile({
    path: 'resources/fe-prep-2.html',
    defaultTopic: 'Frontend System Design',
  });
  console.log(`    → ${fePrep2.length} questions`);
  all.push(...fePrep2);

  console.log('  · sys-design-prep-v1.html (system design guide)');
  const sysDesign = await parseProseFile({
    path: 'resources/sys-design-prep-v1.html',
    defaultTopic: 'Frontend System Design',
  });
  console.log(`    → ${sysDesign.length} questions`);
  all.push(...sysDesign);

  console.log('  · fun-xyz-prep.html (Web3 SDK prep — topics only, branding dropped)');
  const funXyz = await parseProseFile({
    path: 'resources/fun-xyz-prep.html',
    defaultTopic: 'React',
    tags: ['web3'],
  });
  console.log(`    → ${funXyz.length} questions`);
  all.push(...funXyz);

  console.log(`\n▶ Total before dedupe: ${all.length}`);
  const deduped = dedupe(all);
  console.log(`▶ Total after dedupe:  ${deduped.length}\n`);

  // Group by topic and write one file per topic.
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const byTopic = new Map<string, SeedQuestion[]>();
  for (const t of CANONICAL_TOPICS) byTopic.set(t, []);
  for (const q of deduped) {
    byTopic.get(q.topic)?.push(q);
  }

  for (const [topic, qs] of byTopic) {
    const file = join(OUTPUT_DIR, topicToFilename(topic));
    writeFileSync(file, JSON.stringify(qs, null, 2) + '\n');
    console.log(`  ${qs.length.toString().padStart(3)} → ${file}`);
  }

  console.log('\n✓ Done. Run `pnpm seed` to load into Postgres.');
}

main().catch((err) => {
  console.error('\n✗ Extraction failed:', err);
  process.exit(1);
});
