import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import type { RecommendedTopic } from '../dashboard-types';

// Maps topic keywords → accent colours (Tailwind safe-listed classes)
const TOPIC_ACCENT: Record<string, string> = {
  React:          'bg-blue-500/10   text-blue-600   dark:text-blue-400',
  JavaScript:     'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  TypeScript:     'bg-blue-600/10   text-blue-700   dark:text-blue-300',
  'Web Performance': 'bg-green-500/10 text-green-600 dark:text-green-400',
  Testing:        'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  CSS:            'bg-pink-500/10   text-pink-600   dark:text-pink-400',
  Node:           'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Security:       'bg-red-500/10    text-red-600    dark:text-red-400',
};

function topicAccent(topic: string): string {
  for (const [key, cls] of Object.entries(TOPIC_ACCENT)) {
    if (topic.includes(key)) return cls;
  }
  return 'bg-primary/10 text-primary';
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
    <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Recommended next sessions</h2>
      </div>

      {recommendations.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Complete a session — we&apos;ll suggest where to drill next.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {recommendations.map((rec) => {
            const accent = topicAccent(rec.topic);
            return (
              <Link
                key={rec.topic}
                href={`/practice/new?topic=${encodeURIComponent(rec.topic)}&difficulty=${rec.difficulty}`}
                className="group flex flex-col rounded-xl border border-border/60 bg-background p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
              >
                {/* Topic pill */}
                <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${accent}`}>
                  {rec.topic}
                </span>

                {/* Reason */}
                <p className="mt-2.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {rec.reason}
                </p>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {DIFFICULTY_LABELS[rec.difficulty] ?? rec.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
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
