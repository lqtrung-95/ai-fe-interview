import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import type { RecommendedTopic } from '../dashboard-types';

interface Props {
  recommendations: RecommendedTopic[];
}

/**
 * Each card links to /practice/new with pre-selected topic + difficulty via URL
 * search params. The topic-selection form already reads user defaults; the
 * params here override topic for the next session.
 */
export function RecommendedPractice({ recommendations }: Props) {
  return (
    <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      <h2 className="text-sm font-medium">Recommended next sessions</h2>
      {recommendations.length === 0 ? (
        <p className="mt-2 px-2 py-8 text-center text-sm text-muted-foreground">
          Complete a session — we'll suggest where to drill next.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {recommendations.map((rec) => (
            <article
              key={rec.topic}
              className="flex flex-col rounded-md border border-border/70 bg-background p-4"
            >
              <p className="text-sm font-semibold">{rec.topic}</p>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{rec.reason}</p>
              <Link
                href={`/practice/new?topic=${encodeURIComponent(rec.topic)}&difficulty=${rec.difficulty}`}
                className={buttonVariants({ size: 'sm', variant: 'outline' }) + ' mt-3'}
              >
                Practice {rec.topic.split(' ')[0]}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
