import { requireUser } from '@/lib/auth/session';
import { getDueTopics, getReviewStats, getStreak } from '@/features/review/server/review-queue-service';
import { ReviewLanding } from '@/features/review/components/review-landing';

export const metadata = { title: 'Daily Review' };

export default async function ReviewPage() {
  const user = await requireUser();
  const [stats, streak, due] = await Promise.all([
    getReviewStats(user.id),
    getStreak(user.id),
    getDueTopics(user.id, Math.max(user.dailyGoal, 3)),
  ]);

  return (
    <div className="app-page mx-auto max-w-3xl px-6 py-8">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Spaced repetition</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Daily review</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Reinforce your weak topics on a schedule so they stick before the interview.
        </p>
      </header>

      <ReviewLanding
        dueCount={stats.dueCount}
        reviewedToday={stats.reviewedToday}
        dailyGoal={streak.dailyGoal}
        currentStreak={streak.currentStreak}
        dueTopics={due.map((d) => d.topic)}
      />
    </div>
  );
}
