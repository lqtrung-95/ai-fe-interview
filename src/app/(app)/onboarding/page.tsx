import { requireUser } from '@/lib/auth/session';
import { OnboardingForm } from '@/features/onboarding/onboarding-form';

export const metadata = { title: 'Onboarding' };

export default async function OnboardingPage() {
  const user = await requireUser();
  const isEdit = !!user.targetRole;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-8">
        {isEdit ? (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Preferences</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Update your preferences</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Changes apply to your next practice session.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Quick setup</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tell us what you're preparing for</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We use this to tailor question difficulty and topic mix. You can edit anytime in Settings.
            </p>
          </>
        )}
      </header>
      <OnboardingForm
        defaults={{
          level: user.level,
          targetRole: user.targetRole,
          targetCompanyType: user.targetCompanyType,
          preferredTopics: user.preferredTopics,
        }}
        isEdit={isEdit}
        redirectTo={isEdit ? '/settings' : undefined}
      />
    </div>
  );
}
