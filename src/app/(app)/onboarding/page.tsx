import { requireUser } from '@/lib/auth/session';
import { OnboardingForm } from '@/features/onboarding/onboarding-form';

export const metadata = { title: 'Onboarding' };

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Quick setup</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tell us what you're preparing for</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We use this to tailor question difficulty and topic mix. You can edit anytime in Settings.
        </p>
      </header>
      <OnboardingForm
        defaults={{
          level: user.level,
          targetRole: user.targetRole,
          targetCompanyType: user.targetCompanyType,
          preferredTopics: user.preferredTopics,
        }}
      />
    </div>
  );
}
