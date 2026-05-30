import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { buttonVariants } from '@/components/ui/button';
import { ProfileForm } from '@/features/settings/components/profile-form';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  const topics = (user.preferredTopics ?? []) as string[];

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Account</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      {/* Profile card */}
      <section className="rounded-xl border border-border/60 p-6">
        <h2 className="mb-5 text-sm font-bold">Profile</h2>
        <ProfileForm
          userId={user.id}
          initialName={user.name}
          initialAvatarUrl={user.image}
          email={user.email}
        />
      </section>

      {/* Interview preferences card */}
      <section className="rounded-xl border border-border/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold">Interview preferences</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used to tailor question difficulty and topic mix.
            </p>
          </div>
          <Link href="/onboarding" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Edit
          </Link>
        </div>

        {user.targetRole ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Level</dt>
              <dd className="mt-0.5 font-medium capitalize">{user.level ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Target role</dt>
              <dd className="mt-0.5 font-medium">{user.targetRole}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Company type</dt>
              <dd className="mt-0.5 font-medium">{user.targetCompanyType ?? '—'}</dd>
            </div>
            {topics.length > 0 && (
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-xs text-muted-foreground">Topics</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No preferences set yet.{' '}
            <Link href="/onboarding" className="text-primary underline-offset-2 hover:underline">
              Complete setup
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
