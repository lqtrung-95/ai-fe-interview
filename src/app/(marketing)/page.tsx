import { LandingHero } from '@/features/marketing/landing-hero';
import { LandingBenefits } from '@/features/marketing/landing-benefits';
import { LandingCategories } from '@/features/marketing/landing-categories';
import { LandingFeedbackPreview } from '@/features/marketing/landing-feedback-preview';
import { LandingCta } from '@/features/marketing/landing-cta';

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingBenefits />
      <LandingCategories />
      <LandingFeedbackPreview />
      <LandingCta />
    </>
  );
}
