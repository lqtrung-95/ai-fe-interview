import { PremiumLandingPage } from '@/features/marketing/premium-landing-page';
import { getCurrentUser } from '@/lib/auth/session';
import { JsonLd } from '@/components/seo/json-ld';
import { buildSiteIdentityJsonLd } from '@/lib/seo/structured-data';

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
      <JsonLd data={buildSiteIdentityJsonLd()} />
      <PremiumLandingPage ctaHref={ctaHref} />
    </>
  );
}
