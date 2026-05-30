import { LandingHero } from '@/features/marketing/landing-hero';
import { LandingStatsStrip } from '@/features/marketing/landing-stats-strip';
import { LandingHowItWorks } from '@/features/marketing/landing-how-it-works';
import { LandingProductWalkthrough } from '@/features/marketing/landing-product-walkthrough';
import { LandingBenefits } from '@/features/marketing/landing-benefits';
import { LandingBeforeAfter } from '@/features/marketing/landing-before-after';
import { LandingCategories } from '@/features/marketing/landing-categories';
import { LandingTestimonials } from '@/features/marketing/landing-testimonials';
import { LandingPricing } from '@/features/marketing/landing-pricing';
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
      <LandingStatsStrip />
      <LandingHowItWorks />
      <LandingProductWalkthrough />
      <LandingBenefits />
      <LandingBeforeAfter />
      <LandingCategories />
      <LandingTestimonials />
      <LandingPricing ctaHref={ctaHref} />
      <LandingCta ctaHref={ctaHref} />
    </>
  );
}
