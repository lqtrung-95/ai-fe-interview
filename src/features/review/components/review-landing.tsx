'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck, Flame, Zap } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { startReview } from '../server/start-review-action';

interface Props {
  dueCount: number;
  reviewedToday: number;
  dailyGoal: number;
  currentStreak: number;
  dueTopics: string[];
}

export function ReviewLanding({ dueCount, reviewedToday, dailyGoal, currentStreak, dueTopics }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onStart() {
    setError(null);
    startTransition(async () => {
      const result = await startReview();
      if (result.ok) router.push(`/practice/${result.sessionId}`);
      else setError('Nothing is due right now — practice anything to build your queue.');
    });
  }

  const goalMet = reviewedToday >= dailyGoal;

  return (
    <div className="space-y-6">
      {/* Streak + goal strip */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Flame className={currentStreak > 0 ? 'h-4 w-4 text-orange-500' : 'h-4 w-4 text-muted-foreground'} />
          {currentStreak > 0 ? `${currentStreak}-day streak` : 'No streak yet'}
        </span>
        <span className="text-muted-foreground">
          Today: {reviewedToday}/{dailyGoal} {goalMet && '✓'}
        </span>
      </div>

      {dueCount > 0 ? (
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <CalendarCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {dueCount} {dueCount === 1 ? 'topic' : 'topics'} due for review
            </h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Spaced repetition resurfaces what you&apos;re weakest on, right when you&apos;re about to forget it.
          </p>
          {dueTopics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dueTopics.map((t) => (
                <span key={t} className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Button size="lg" onClick={onStart} disabled={isPending}>
              {isPending ? 'Starting…' : `Start review (${dueCount} due)`}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-border/70 bg-card/50 p-8 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <h2 className="mt-3 text-lg font-semibold">You&apos;re all caught up</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Nothing is due. Practice any session and the topics you answer will enter
            your review queue automatically.
          </p>
          <Link href="/practice/new" className={`mt-5 ${buttonVariants({ size: 'lg' })}`}>
            <Zap className="h-4 w-4" />
            Practice now
          </Link>
        </section>
      )}
    </div>
  );
}
