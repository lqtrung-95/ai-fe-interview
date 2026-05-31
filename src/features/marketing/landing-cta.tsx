import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function LandingCta({ ctaHref = '/sign-in?next=/onboarding' }: { ctaHref?: string }) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card px-8 py-16 text-center shadow-sm">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-64 w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />

        <p className="relative text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Practice with a clear next step
        </p>
        <h2 className="relative mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to practice your next{' '}
          <span className="text-primary">frontend interview</span>?
        </h2>
        <p className="relative mt-4 text-sm leading-7 text-muted-foreground">
          Three questions. Honest AI feedback. Five minutes well spent.
        </p>

        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className={buttonVariants({ size: 'lg' })}
          >
            Start Free Session
          </Link>
          <Link
            href="/demo"
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
          >
            See how it works
          </Link>
        </div>

        <p className="relative mt-4 text-xs text-muted-foreground">
          No credit card required · No CV required · Add one anytime for personalized questions
        </p>
      </div>
    </section>
  );
}
