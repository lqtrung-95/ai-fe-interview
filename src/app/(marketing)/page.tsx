import { PremiumLandingPage } from '@/features/marketing/premium-landing-page';
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

  return <PremiumLandingPage ctaHref={ctaHref} />;
}
