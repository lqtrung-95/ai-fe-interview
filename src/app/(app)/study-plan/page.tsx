import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { getUserStudyPlan } from '@/features/study-plan/server/study-plan-service';
import { StudyPlanSetupForm } from '@/features/study-plan/components/study-plan-setup-form';
import { StudyPlanProgressHeader } from '@/features/study-plan/components/study-plan-progress-header';
import { StudyPlanDaySchedule } from '@/features/study-plan/components/study-plan-day-schedule';

export const metadata: Metadata = { title: 'Study Plan' };

interface PageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function StudyPlanPage({ searchParams }: PageProps) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const plan = await getUserStudyPlan(user.id);

  const isEdit = sp.edit === '1' && plan !== null;

  if (!plan || isEdit) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        <div className="space-y-1.5">
          {isEdit && (
            <Link
              href="/study-plan"
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to plan
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? 'Edit study plan' : 'Create your study plan'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? 'Updating resets the clock — your tracked progress is preserved.'
              : "Pick your topics, level, and how long you have to prepare. We'll build a daily question schedule."}
          </p>
        </div>

        <StudyPlanSetupForm
          defaultTopics={plan?.topics ?? []}
          defaultLevel={plan?.level ?? 'mid'}
          defaultPrepWeeks={plan?.prepWeeks ?? 4}
          isEdit={isEdit}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Study Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
            {plan.topics.join(' · ')}
          </p>
        </div>
        <Link
          href="/study-plan?edit=1"
          className="shrink-0 rounded-lg border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          Edit plan
        </Link>
      </div>

      {/* Progress overview */}
      <StudyPlanProgressHeader
        stats={plan.stats}
        level={plan.level}
        prepWeeks={plan.prepWeeks}
      />

      {/* Daily schedule */}
      <StudyPlanDaySchedule
        currentDayIndex={plan.stats.currentDayIndex}
        schedule={plan.schedule}
        studiedIds={plan.studiedIds}
      />
    </div>
  );
}
