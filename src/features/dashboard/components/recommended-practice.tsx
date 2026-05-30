import Link from 'next/link';
import { ArrowRight, Clock3, Sparkles, Timer } from 'lucide-react';
import type { RecommendedTopic } from '../dashboard-types';

const TOPIC_ACCENT: Record<string, { icon: string; border: string; badge: string }> = {
  React: {
    icon: 'bg-sky-500/10 text-sky-400',
    border: 'hover:border-sky-500/40',
    badge: 'bg-sky-500/10 text-sky-400',
  },
  JavaScript: {
    icon: 'bg-yellow-500/10 text-yellow-400',
    border: 'hover:border-yellow-500/40',
    badge: 'bg-yellow-500/10 text-yellow-400',
  },
  'Web Performance': {
    icon: 'bg-emerald-500/10 text-emerald-400',
    border: 'hover:border-emerald-500/40',
    badge: 'bg-emerald-500/10 text-emerald-400',
  },
  Testing: {
    icon: 'bg-violet-500/10 text-violet-400',
    border: 'hover:border-violet-500/40',
    badge: 'bg-violet-500/10 text-violet-400',
  },
};

function topicAccent(topic: string) {
  for (const [key, value] of Object.entries(TOPIC_ACCENT)) {
    if (topic.includes(key)) return value;
  }
  return {
    icon: 'bg-primary/10 text-primary',
    border: 'hover:border-primary/40',
    badge: 'bg-primary/10 text-primary',
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
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Recommended sessions</h2>
          <p className="text-xs text-muted-foreground">Based on your latest feedback.</p>
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
                className={`group flex min-h-40 flex-col rounded-xl border border-border/60 bg-background/60 p-3.5 transition-all dark:bg-muted/20 ${accent.border} hover:shadow-sm`}
              >
                {/* Top row: icon + difficulty badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${accent.icon}`}>
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${accent.badge}`}>
                    {DIFFICULTY_LABELS[rec.difficulty] ?? rec.difficulty}
                  </span>
                </div>

                {/* Topic title */}
                <div className="mt-3 min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[13px] font-semibold leading-5">{title}</h3>
                  {focus && (
                    <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{focus}</p>
                  )}
                  <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                    {rec.reason}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Timer className="h-3 w-3" />
                    10 min
                  </span>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-primary transition-colors group-hover:underline">
                    Start <ArrowRight className="h-3 w-3" />
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
    <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-5 py-10 text-center dark:bg-muted/10">
      <Clock3 className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">No recommendations yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Complete a session and we'll suggest where to drill next.
      </p>
    </div>
  );
}

function splitTopic(topic: string) {
  const [title, ...rest] = topic.split(':');
  return { title: title.trim(), focus: rest.join(':').trim() };
}
