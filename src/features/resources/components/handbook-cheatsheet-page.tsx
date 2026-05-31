import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HandbookData } from '@/data/resources/handbook-types';
import { buildCheatsheet } from '../cheatsheet-builder';
import { CheatsheetView } from './cheatsheet-view';

interface Props {
  /** JSON filename under src/data/resources, e.g. "optimization-deep-dive.json". */
  dataFile: string;
  /** Link back to the full handbook. */
  backHref: string;
  /** Label for the back link, e.g. "Optimization Deep Dive". */
  backLabel: string;
}

/**
 * Shared server component for a handbook cheatsheet page.
 * Loads the handbook JSON, derives the condensed cheatsheet, and renders it.
 * Each route is a thin wrapper passing its own dataFile/backHref.
 */
export function HandbookCheatsheetPage({ dataFile, backHref, backLabel }: Props) {
  const raw = readFileSync(join(process.cwd(), 'src/data/resources', dataFile), 'utf-8');
  const data = JSON.parse(raw) as HandbookData;
  const cheatsheet = buildCheatsheet(data);

  return <CheatsheetView cheatsheet={cheatsheet} backHref={backHref} backLabel={backLabel} />;
}
