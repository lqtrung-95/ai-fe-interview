'use client';

import type { CvData } from '@/lib/cv/cv-types';

interface Props {
  cvData: CvData;
  parsedAt: string | null;
}

export function ParsedCvPreview({ cvData, parsedAt }: Props) {
  return (
    <div className="space-y-5">
      {cvData.roles.length > 0 && (
        <section className="space-y-2.5">
          <SectionLabel>Experience</SectionLabel>
          <div className="space-y-2.5">
            {cvData.roles.slice(0, 3).map((role, index) => (
              <article key={`${role.company}-${index}`} className="rounded-lg border border-border/60 bg-muted/15 px-4 py-3.5">
                <p className="text-sm font-semibold text-foreground">{role.title} <span className="text-muted-foreground">·</span> {role.company}</p>
                {role.duration && <p className="mt-0.5 text-xs text-muted-foreground">{role.duration}</p>}
                {role.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {role.highlights.slice(0, 2).map((highlight, highlightIndex) => (
                      <li key={highlightIndex} className="grid grid-cols-[6px_1fr] gap-2 text-xs leading-5 text-muted-foreground">
                        <span className="mt-[7px] size-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {cvData.skills.length > 0 && (
        <section className="space-y-2.5">
          <SectionLabel>Skills</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {cvData.skills.slice(0, 16).map((skill) => (
              <span key={skill} className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                {skill}
              </span>
            ))}
            {cvData.skills.length > 16 && (
              <span className="self-center text-xs text-muted-foreground">+{cvData.skills.length - 16} more</span>
            )}
          </div>
        </section>
      )}

      <footer className="border-t border-border/50 pt-3">
        <p className="text-[11px] text-muted-foreground">
          {parsedAt
            ? `Parsed ${new Date(parsedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'Parsed'}
        </p>
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{children}</h3>;
}
