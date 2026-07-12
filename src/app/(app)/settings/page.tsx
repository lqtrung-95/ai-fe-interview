import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { InterviewPreferencesCard } from '@/features/settings/components/interview-preferences-card';
import { CvProfileCard } from '@/features/settings/components/cv-profile-card';
import { TargetJobsCard } from '@/features/target-jobs/components/target-jobs-card';
import { InterviewDateCard } from '@/features/settings/components/interview-date-card';
import { DailyGoalCard } from '@/features/settings/components/daily-goal-card';
import type { CvData } from '@/lib/cv/cv-types';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  const topics = (user.preferredTopics ?? []) as string[];

  const cvData = (user.cvData as CvData | null) ?? null;

  const rawTargetJobs = await prisma.targetJob.findMany({
    where: { userId: user.id },
    select: { id: true, label: true, jdContext: true },
    orderBy: { createdAt: 'desc' },
  });
  // Serialize the JSON column into the shape the client card expects.
  const targetJobs = rawTargetJobs.map((job) => ({
    id: job.id,
    label: job.label,
    jdContext: job.jdContext as import('@/features/target-jobs/target-job-types').JdContext | null,
  }));

  return (
    <div className="app-page mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Account</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <section className="app-surface-card rounded-xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-5">
          <h2 className="text-base font-bold">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage how your account appears inside the app.</p>
        </div>
        <ProfileForm
          userId={user.id}
          initialName={user.name}
          initialAvatarUrl={user.image}
          email={user.email}
        />
      </section>

      <InterviewPreferencesCard
        companyType={user.targetCompanyType}
        level={user.level}
        role={user.targetRole}
        topics={topics}
      />

      <CvProfileCard
        cvData={cvData}
        cvParsedAt={user.cvParsedAt?.toISOString() ?? null}
      />

      <TargetJobsCard
        isPro={user.isPro}
        initialJobs={targetJobs}
      />

      <InterviewDateCard
        initialDate={user.targetInterviewDate?.toISOString() ?? null}
      />

      <DailyGoalCard initialGoal={user.dailyGoal} />
    </div>
  );
}
