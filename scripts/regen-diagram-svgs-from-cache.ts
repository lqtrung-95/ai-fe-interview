/**
 * Re-renders diagramSvg for every cached qgen_v8 entry using the current
 * diagram-spec-renderer.ts — zero OpenAI calls needed.
 *
 * Usage: pnpm tsx scripts/regen-diagram-svgs-from-cache.ts
 *
 * After this runs, execute:
 *   pnpm extract-seed   ← regenerates seed JSON from updated cache
 *   pnpm seed           ← pushes updated SVGs to DB
 */

import { readFileSync, writeFileSync } from 'node:fs';
import type { DiagramSpec } from './extract-seed-types';
import { renderDiagramSpec } from './diagram-spec-renderer';

const CACHE_PATH = 'scripts/.translation-cache.json';

interface CachedQuestion {
  diagramSpec?: DiagramSpec;
  diagramSvg?: string;
  [key: string]: unknown;
}

const cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as Record<string, string>;

let updated = 0;
let skipped = 0;

for (const [key, raw] of Object.entries(cache)) {
  // Only process LLM-generated question entries (not translation cache)
  if (!key.startsWith('qgen_')) continue;

  let questions: CachedQuestion[];
  try {
    questions = JSON.parse(raw) as CachedQuestion[];
  } catch {
    continue;
  }

  let changed = false;
  for (const q of questions) {
    const spec = q.diagramSpec as DiagramSpec | undefined;
    if (!spec?.nodes?.length) { skipped++; continue; }

    try {
      const newSvg = renderDiagramSpec(spec);
      if (newSvg !== q.diagramSvg) {
        q.diagramSvg = newSvg;
        changed = true;
        updated++;
      }
    } catch {
      skipped++;
    }
  }

  if (changed) {
    cache[key] = JSON.stringify(questions);
  }
}

writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
console.log(`✓ Re-rendered ${updated} diagram SVGs (${skipped} skipped / no spec)`);
console.log('  → Now run: pnpm extract-seed && pnpm seed');
