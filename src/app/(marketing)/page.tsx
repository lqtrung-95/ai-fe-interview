import { LandingHero } from '@/features/marketing/landing-hero';
import { LandingBenefits } from '@/features/marketing/landing-benefits';
import { LandingCategories } from '@/features/marketing/landing-categories';
import { LandingFeedbackPreview } from '@/features/marketing/landing-feedback-preview';
import { LandingCta } from '@/features/marketing/landing-cta';
import { getCurrentUser } from '@/lib/auth/session';

export default async function LandingPage() {
  const user = await getCurrentUser();

  // Smart CTA routing:
  //   Not signed in     → sign-in page (post-login → onboarding)
  //   Signed in, new    → onboarding (targetRole null means never completed)
  //   Signed in, done   → practice directly
  const ctaHref = user
    ? user.targetRole
      ? '/practice/new'
      : '/onboarding'
    : '/sign-in?next=/onboarding';

  return (
    <>
      <LandingHero ctaHref={ctaHref} />
      <LandingBenefits />
      <LandingCategories />
      <LandingFeedbackPreview />
      <LandingCta ctaHref={ctaHref} />
    </>
  );
}
