/**
 * Maps a ContentBlock[] array to JSX for the handbook detail page.
 * Server component — client components (QuizCard, FlashcardDeck) are imported
 * and rendered lazily within the server-rendered tree.
 */

import { cn } from '@/lib/utils';
import type { ContentBlock, PillVariant } from '@/data/resources/handbook-types';
import { HandbookCallout } from './handbook-callout';
import { HandbookDiagram } from './handbook-diagram';
import { HandbookTableBlock } from './handbook-table-block';
import { HandbookQuizBlock } from './handbook-quiz-block';
import { HandbookFlashcardDeck } from './handbook-flashcard-deck';

interface Props {
  blocks: ContentBlock[];
}

const PILL_CLS: Record<PillVariant, string> = {
  good: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/8',
  bad: 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/8',
  neutral: 'text-muted-foreground border-border/60 bg-muted/40',
};

export function HandbookContentRenderer({ blocks }: Props) {
  return (
    <div className="space-y-0.5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h3':
            return (
              <h3
                key={i}
                className="text-[1.05rem] font-semibold mt-10 mb-3 text-foreground flex items-center gap-2.5
                           before:content-[''] before:block before:h-4 before:w-[3px] before:rounded-full before:bg-primary/60 before:shrink-0"
              >
                {block.text}
              </h3>
            );

          case 'h4':
            return (
              <h4
                key={i}
                className="text-sm font-semibold mt-6 mb-2 text-foreground/90 uppercase tracking-wide"
              >
                {block.text}
              </h4>
            );

          case 'p':
            return (
              <p
                key={i}
                className="text-sm text-muted-foreground leading-[1.75] my-2.5"
                // HTML from our own extraction script — safe, no user input
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            );

          case 'ul':
            return (
              <ul key={i} className="space-y-1.5 my-3 ml-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    {/* Solid dot bullet aligned with first line */}
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    {/* items may contain inline HTML from LLM generation — safe (script-generated) */}
                    {/* eslint-disable-next-line react/no-danger */}
                    <span className="handbook-inline-html" dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={i} className="space-y-1.5 my-3 ml-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    <span className="shrink-0 mt-0.5 min-w-[1.25rem] text-right font-mono text-[11px] text-primary/60 font-semibold">
                      {j + 1}.
                    </span>
                    {/* eslint-disable-next-line react/no-danger */}
                    <span className="handbook-inline-html" dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ol>
            );

          case 'pre':
            return (
              <div key={i} className="my-5 rounded-xl overflow-hidden border border-border/60 bg-[#0d1117]">
                {/* Code block header bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
                  <div className="flex items-center gap-1.5">
                    {/* Traffic-light dots */}
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                  {block.label && (
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                      {block.label}
                    </span>
                  )}
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono leading-[1.7] text-slate-300 whitespace-pre">
                  {block.code}
                </pre>
              </div>
            );

          case 'callout':
            return (
              <HandbookCallout
                key={i}
                variant={block.variant}
                title={block.title}
                body={block.body}
              />
            );

          case 'diagram':
            return (
              <HandbookDiagram key={i} svg={block.svg} caption={block.caption} />
            );

          case 'table':
            return (
              <HandbookTableBlock
                key={i}
                headers={block.headers}
                rows={block.rows}
              />
            );

          case 'quiz':
            return <HandbookQuizBlock key={i} data={block} />;

          case 'flashcards':
            return <HandbookFlashcardDeck key={i} items={block.items} />;

          case 'pills':
            return (
              <div key={i} className="flex flex-wrap gap-2 my-4">
                {block.items.map((p, j) => (
                  <span
                    key={j}
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-mono font-medium border',
                      PILL_CLS[p.variant],
                    )}
                  >
                    {p.text}
                  </span>
                ))}
              </div>
            );

          case 'cards':
            return (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5"
              >
                {block.items.map((c, j) => (
                  <div
                    key={j}
                    className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2
                               hover:border-primary/30 hover:bg-primary/3 transition-colors duration-150"
                  >
                    <div className="text-xl leading-none">{c.icon}</div>
                    <h4 className="text-sm font-semibold text-foreground leading-snug">
                      {c.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
