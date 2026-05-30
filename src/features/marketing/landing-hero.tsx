import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function LandingHero({ ctaHref = '/sign-in?next=/onboarding' }: { ctaHref?: string }) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Built for senior frontend engineers
        </div>
        <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Practice frontend interviews like a <span className="text-primary">senior engineer</span>
        </h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
          Get realistic questions, structured scoring, senior-level answer rewrites, and a study plan based on your weak spots.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={ctaHref} className={buttonVariants({ size: 'lg' })}>
            Start free mock interview
          </Link>
          <Link href="/demo" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            View sample feedback
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            Takes 5 minutes
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-card p-5 shadow-sm">
        <p className="text-xs text-muted-foreground">Question</p>
        <h2 className="mt-2 text-sm font-semibold">How would you debug a slow React page?</h2>
        <div className="mt-5 rounded-md border border-border/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Score</p>
            <span className="rounded bg-orange-500/10 px-2 py-1 text-xs text-orange-700 dark:text-orange-300">Needs improvement</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">3.2 / 5</p>
        </div>
        <div className="mt-5 space-y-2 text-sm">
          {['Missing performance metrics', 'No bottleneck classification', 'No verification step'].map((item) => (
            <p key={item} className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {item}
            </p>
          ))}
        </div>
        <div className="mt-5 rounded-md bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary">Better answer preview</p>
          <p className="mt-2 text-sm leading-6 text-foreground/75">
            I’d start by capturing a performance profile in React DevTools to identify wasted renders...
          </p>
          <Link href="/demo" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            View full feedback <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
