import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import type { GlossaryData, GlossaryCategory } from '@/data/resources/glossary-types';
import { GlossaryClient } from '@/features/resources/components/glossary-client';

export const metadata: Metadata = {
  title: 'Frontend Glossary',
  description: '133 frontend engineering terms defined for interview preparation — searchable by name and category.',
};

function loadGlossary(): GlossaryData {
  const raw = readFileSync(
    join(process.cwd(), 'src/data/resources/glossary.json'),
    'utf-8',
  );
  return JSON.parse(raw) as GlossaryData;
}

export default function GlossaryPage() {
  const { entries } = loadGlossary();

  // Deduplicate and sort categories by frequency (most terms first)
  const catCount = new Map<GlossaryCategory, number>();
  for (const e of entries) catCount.set(e.category, (catCount.get(e.category) ?? 0) + 1);
  const categories = Array.from(catCount.keys()).sort(
    (a, b) => (catCount.get(b) ?? 0) - (catCount.get(a) ?? 0),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 lg:px-10 py-10">
      {/* Page header */}
      <div className="mb-8 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Resources · Glossary
        </p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Frontend Glossary
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {entries.length} terms covering performance, rendering, networking, JavaScript internals,
          architecture patterns, and more — each linked back to the handbook section where it's explained in depth.
        </p>
      </div>

      <GlossaryClient entries={entries} categories={categories} />
    </div>
  );
}
