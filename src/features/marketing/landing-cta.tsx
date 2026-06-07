import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function LandingCta({ ctaHref = '/sign-in?next=/onboarding' }: { ctaHref?: string }) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <div className="marketing-cta-card relative overflow-hidden rounded-2xl border border-border/70 bg-card px-8 py-16 text-center shadow-sm">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-64 w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 size-56 rounded-full bg-brand-teal/10 blur-[70px]" />

        <p className="relative text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Practice now. Add Pro context later.
        </p>
        <h2 className="relative mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to practice for your next{' '}
          <span className="marketing-gradient-text">target role</span>?
        </h2>
        <p className="relative mt-4 text-sm leading-7 text-muted-foreground">
          Start with a free session, add CV context when useful, and upgrade for saved JD-targeted questions.
        </p>

        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className={buttonVariants({ size: 'lg', className: 'marketing-gradient-button' })}
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
          No credit card required · No CV required · JD targeting is included in Pro
        </p>
      </div>
    </section>
  );
}
