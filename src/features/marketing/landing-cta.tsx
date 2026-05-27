import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function LandingCta() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">Start your first mock interview</h2>
      <p className="mt-3 text-muted-foreground">
        Three questions. Honest feedback. Five minutes well spent.
      </p>
      <div className="mt-8">
        <Link href="/sign-in?next=/onboarding" className={buttonVariants({ size: 'lg' })}>
          Start Practicing
        </Link>
      </div>
    </section>
  );
}
