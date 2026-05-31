import { requireUser } from '@/lib/auth/session';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { InterviewPreferencesCard } from '@/features/settings/components/interview-preferences-card';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  const topics = (user.preferredTopics ?? []) as string[];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Account</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
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
    </div>
  );
}
