import Link from 'next/link';
import { ChevronLeft, Lightbulb, AlertTriangle, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CheatsheetPrintButton } from './cheatsheet-print-button';
import type { CalloutVariant } from '@/data/resources/handbook-types';
import type { CheatsheetData, CheatsheetSection } from '../cheatsheet-builder';

interface Props {
  cheatsheet: CheatsheetData;
  /** Link back to the full handbook. */
  backHref: string;
  backLabel: string;
}

const VARIANT_META: Record<CalloutVariant, { Icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  key:       { Icon: Zap,            cls: 'text-primary' },
  interview: { Icon: MessageSquare,  cls: 'text-foreground' },
  warn:      { Icon: AlertTriangle,  cls: 'text-amber-500' },
  tip:       { Icon: Lightbulb,      cls: 'text-emerald-500' },
};

export function CheatsheetView({ cheatsheet, backHref, backLabel }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 print:px-0 print:py-0">
      {/* Header — hidden controls when printing */}
      <header className="mb-6 print:mb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 print:hidden"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1">
              Cheatsheet
            </p>
            <h1 className="text-xl font-bold tracking-tight print:text-lg">{cheatsheet.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl print:hidden">
              Condensed for last-minute review — every key takeaway, decision table, and recall card.
            </p>
          </div>
          <CheatsheetPrintButton />
        </div>
      </header>

      {/* Dense multi-column grid of section cards */}
      <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2 print:gap-2">
        {cheatsheet.sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: CheatsheetSection }) {
  return (
    <section className="break-inside-avoid rounded-xl border border-border/60 bg-card p-4 space-y-3 print:border-border print:p-3">
      {/* Section heading */}
      <div className="flex items-baseline gap-2 border-b border-border/40 pb-2">
        <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.12em] text-primary/70">
          {section.num}
        </span>
        <h2 className="text-sm font-bold leading-tight">{section.title}</h2>
      </div>

      {/* Key takeaways */}
      {section.takeaways.length > 0 && (
        <ul className="space-y-1.5">
          {section.takeaways.map((t, i) => {
            const { Icon, cls } = VARIANT_META[t.variant];
            return (
              <li key={i} className="flex gap-2 text-xs leading-snug">
                <Icon className={cn('h-3 w-3 shrink-0 mt-0.5', cls)} />
                <span>
                  <span className="font-semibold text-foreground">{t.title}: </span>
                  {/* body may contain inline HTML (<code>, <strong>) from handbook data */}
                  {/* eslint-disable-next-line react/no-danger */}
                  <span className="handbook-inline-html text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.body }} />
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Decision tables */}
      {section.tables.map((table, ti) => (
        <div key={ti} className="overflow-x-auto rounded-md border border-border/50">
          <table className="w-full text-[10px]">
            {table.headers.length > 0 && (
              <thead>
                <tr className="bg-muted/40">
                  {table.headers.map((h, i) => (
                    <th key={i} className="px-2 py-1 text-left font-semibold text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border/40">
              {table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1 align-top text-muted-foreground leading-snug">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Flashcards as tight Q→A list */}
      {section.flashcards.length > 0 && (
        <dl className="space-y-1">
          {section.flashcards.map((fc, i) => (
            <div key={i} className="text-[11px] leading-snug">
              {/* eslint-disable-next-line react/no-danger */}
              <dt className="handbook-inline-html font-medium text-foreground/90 inline" dangerouslySetInnerHTML={{ __html: fc.front + ' ' }} />
              {/* eslint-disable-next-line react/no-danger */}
              <dd className="handbook-inline-html text-muted-foreground inline" dangerouslySetInnerHTML={{ __html: '— ' + fc.back }} />
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
