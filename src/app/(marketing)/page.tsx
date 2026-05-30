import { LandingHero } from '@/features/marketing/landing-hero';
import { LandingStatsStrip } from '@/features/marketing/landing-stats-strip';
import { LandingProductWalkthrough } from '@/features/marketing/landing-product-walkthrough';
import { LandingBeforeAfter } from '@/features/marketing/landing-before-after';
import { LandingCategories } from '@/features/marketing/landing-categories';
import { LandingPricing } from '@/features/marketing/landing-pricing';
import { LandingFaq } from '@/features/marketing/landing-faq';
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
      <div className="border-y border-border/50 bg-card/30">
        <LandingProductWalkthrough />
      </div>
      <LandingBeforeAfter />
      <div className="border-y border-border/50 bg-card/30">
        <LandingCategories />
      </div>
      <LandingPricing ctaHref={ctaHref} />
      <LandingFaq />
      <div className="border-t border-border/50 bg-card/30">
        <LandingCta ctaHref={ctaHref} />
      </div>
    </>
  );
}
