import Link from 'next/link';
import { ArrowRight, Clock3, Sparkles, Zap } from 'lucide-react';
import type { RecommendedTopic } from '../dashboard-types';

const DIFFICULTY_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid:    'Mid-level',
  senior: 'Senior',
  staff:  'Staff',
};

interface Props {
  recommendations: RecommendedTopic[];
}

export function RecommendedPractice({ recommendations }: Props) {
  const [primary, ...secondary] = recommendations;

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="size-3.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">AI Recommendations</h2>
          <p className="text-xs text-muted-foreground">Personalised based on your recent feedback.</p>
        </div>
      </div>

      {!primary ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
              Next recommended session
            </p>

            <div>
              <h3 className="text-base font-bold leading-snug">{primary.topic}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {primary.reason}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {DIFFICULTY_LABELS[primary.difficulty] ?? primary.difficulty}
              </span>
              <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                5 questions
              </span>
            </div>

            <Link
              href={`/practice/new?topic=${encodeURIComponent(primary.topic)}&difficulty=${primary.difficulty}`}
              className="flex w-full items-center justify-between gap-3 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <span className="flex items-center gap-2">
                <Zap className="size-4" />
                Start recommended drill
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {secondary.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">More to revisit</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {secondary.map((rec) => (
                  <Link
                    key={rec.topic}
                    href={`/practice/new?topic=${encodeURIComponent(rec.topic)}&difficulty=${rec.difficulty}`}
                    className="group flex flex-col gap-1.5 rounded-xl border border-border/50 bg-background/60 p-3.5 transition-all hover:border-primary/30 hover:bg-primary/[0.02] dark:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold leading-snug text-foreground">{rec.topic}</h4>
                      <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                    </div>
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{rec.reason}</p>
                    <span className="mt-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {DIFFICULTY_LABELS[rec.difficulty] ?? rec.difficulty}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-5 py-10 text-center dark:bg-muted/10">
      <Clock3 className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">No recommendations yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Complete a session and we'll suggest where to drill next.
      </p>
    </div>
  );
}
