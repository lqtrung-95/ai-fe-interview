import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import type { HandbookData } from '@/data/resources/handbook-types';
import { HandbookSidebar } from '@/features/resources/components/handbook-sidebar';
import { HandbookContentRenderer } from '@/features/resources/components/handbook-content-renderer';

// Read JSON at request time on the server — avoids Turbopack JSON import quirks
// and keeps the large SVG payload out of the JS bundle.
function loadHandbook(): HandbookData {
  const filePath = join(process.cwd(), 'src/data/resources/frontend-system-design.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as HandbookData;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = loadHandbook();
    return {
      title: data.meta.title,
      description: data.meta.description,
    };
  } catch {
    return {
      title: 'Frontend System Design',
      description: 'In-depth Frontend System Design handbook.',
    };
  }
}

export default function FrontendSystemDesignPage() {
  const data = loadHandbook();

  return (
    <div className="flex min-h-screen">
      {/* Handbook sidebar — sticky, hidden on mobile */}
      <HandbookSidebar nav={data.nav} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Hero header */}
        <header className="relative border-b border-border/60 px-6 lg:px-12 pt-10 pb-8 overflow-hidden">
          {/* Subtle radial glow behind title */}
          <div
            className="pointer-events-none absolute -top-20 -left-10 h-72 w-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'var(--color-primary)' }}
          />

          <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Frontend System Design
          </p>
          <h1 className="relative text-2xl lg:text-3xl font-bold tracking-tight max-w-3xl">
            {data.meta.title}
          </h1>
          <p className="relative text-muted-foreground max-w-2xl text-sm leading-relaxed mt-3">
            {data.meta.description}
          </p>

          {/* Stats bar */}
          {data.meta.stats.length > 0 && (
            <div className="relative flex flex-wrap gap-6 mt-6 pt-5 border-t border-border/40">
              {data.meta.stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-bold font-mono text-foreground tabular-nums leading-none">
                    {s.value}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Sections — fill available width, padding provides breathing room */}
        <div className="px-6 lg:px-12 pb-32">
          {data.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="py-14 border-b border-border/30 scroll-mt-6 last:border-b-0"
            >
              {/* Section heading */}
              <div className="mb-6">
                {/* Number badge */}
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary uppercase tracking-[0.15em] border border-primary/20 mb-3">
                  {section.num}
                </span>
                <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                  {section.title}
                </h2>
                {section.intro && (
                  <p className="text-muted-foreground mt-2.5 max-w-2xl text-sm leading-relaxed">
                    {section.intro}
                  </p>
                )}
              </div>

              {/* Section content blocks */}
              <HandbookContentRenderer blocks={section.blocks} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
