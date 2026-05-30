import Link from 'next/link';
import { ArrowRight, Clock3, Sparkles, Timer, TrendingUp } from 'lucide-react';
import type { RecommendedTopic } from '../dashboard-types';

const TOPIC_ACCENT: Record<string, { icon: string; card: string }> = {
  React: {
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
    card: 'hover:border-blue-500/40',
  },
  JavaScript: {
    icon: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
    card: 'hover:border-yellow-500/40',
  },
  'Web Performance': {
    icon: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    card: 'hover:border-emerald-500/40',
  },
  Testing: {
    icon: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    card: 'hover:border-violet-500/40',
  },
};

function topicAccent(topic: string) {
  for (const [key, value] of Object.entries(TOPIC_ACCENT)) {
    if (topic.includes(key)) return value;
  }
  return {
    icon: 'bg-primary/10 text-primary',
    card: 'hover:border-primary/40',
  };
}

const DIFFICULTY_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid:    'Mid',
  senior: 'Senior',
};

interface Props {
  recommendations: RecommendedTopic[];
}

export function RecommendedPractice({ recommendations }: Props) {
  return (
    <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm dark:shadow-none">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Recommended next sessions</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Based on your latest feedback.</p>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {recommendations.map((rec) => {
            const accent = topicAccent(rec.topic);
            const { title, focus } = splitTopic(rec.topic);
            return (
              <Link
                key={rec.topic}
                href={`/practice/new?topic=${encodeURIComponent(rec.topic)}&difficulty=${rec.difficulty}`}
                className={`group flex min-h-40 flex-col rounded-xl border border-border/70 bg-background/70 p-3.5 transition-colors dark:bg-muted/20 ${accent.card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent.icon}`}>
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium leading-4 text-muted-foreground">
                    {DIFFICULTY_LABELS[rec.difficulty] ?? rec.difficulty}
                  </span>
                </div>

                <div className="mt-3.5 min-w-0">
                  <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-foreground">
                    {title}
                  </h3>
                  {focus && (
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                      {focus}
                    </p>
                  )}
                </div>

                <p className="mt-3 line-clamp-2 flex-1 text-[11px] leading-4 text-muted-foreground">
                  {rec.reason}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium leading-4 text-muted-foreground">
                    <Timer className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">10 min</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-primary transition-colors group-hover:bg-primary/10">
                    Start <ArrowRight className="h-3 w-3 shrink-0" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-5 py-8 text-center dark:bg-muted/20">
      <Clock3 className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">No recommendations yet</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        Complete a session and we&apos;ll suggest where to drill next.
      </p>
    </div>
  );
}

function splitTopic(topic: string) {
  const [title, ...rest] = topic.split(':');
  return {
    title: title.trim(),
    focus: rest.join(':').trim(),
  };
}
