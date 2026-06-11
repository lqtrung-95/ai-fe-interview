/**
 * Topic-grouped question list for the public /questions hub.
 * Server component — every question is a plain crawlable link.
 */

import Link from 'next/link';
import { ChevronRight, Image as ImageIcon } from 'lucide-react';
import type { PublicQuestionSummary } from '@/features/study/server/study-public-service';
import { DIFFICULTY_BADGE_CLASSES } from './public-question-badge-maps';

interface Props {
  questions: PublicQuestionSummary[];
}

export function PublicQuestionHubList({ questions }: Props) {
  // Preserve the service's topic-asc ordering while grouping.
  const byTopic = new Map<string, PublicQuestionSummary[]>();
  for (const q of questions) {
    const list = byTopic.get(q.topic) ?? [];
    list.push(q);
    byTopic.set(q.topic, list);
  }

  return (
    <div className="space-y-10">
      {[...byTopic.entries()].map(([topic, items]) => (
        <section key={topic} id={topicAnchor(topic)} className="space-y-3 scroll-mt-20">
          <h2 className="flex items-baseline gap-2 text-lg font-bold tracking-tight">
            {topic}
            <span className="text-xs font-medium text-muted-foreground">
              {items.length} question{items.length === 1 ? '' : 's'}
            </span>
          </h2>
          <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/80">
            {items.map((q) => (
              <Link
                key={q.slug}
                href={`/questions/${q.slug}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 text-sm leading-snug text-foreground/90 group-hover:text-foreground">
                  {q.question}
                </span>
                {q.hasDiagram && (
                  <ImageIcon aria-label="Has diagram" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_BADGE_CLASSES[q.difficulty] ?? ''}`}
                >
                  {q.difficulty}
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function topicAnchor(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
