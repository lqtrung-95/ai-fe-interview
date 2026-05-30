import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function LandingHero({ ctaHref = '/sign-in?next=/onboarding' }: { ctaHref?: string }) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Built for frontend interview practice
        </div>

        <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.06] tracking-tight sm:text-6xl">
          Practice frontend interviews like a <span className="text-primary">senior engineer</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
          Answer realistic questions, get rubric-based feedback, and turn each weak spot into your next focused drill.
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
            Start in five minutes
          </span>
        </div>
      </div>

      <FeedbackPreview />
    </section>
  );
}

function FeedbackPreview() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-md shadow-black/5 dark:shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question</p>
          <h2 className="mt-2 text-sm font-semibold">How would you debug a slow React page?</h2>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">React</span>
      </div>

      <div className="mt-5 rounded-lg border border-border/70 bg-background/60 p-4">
        <p className="text-xs text-muted-foreground">Overall score</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-3xl font-bold">3.2 / 5</p>
          <span className="rounded-md bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
            Needs improvement
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top feedback</p>
        <div className="mt-3 space-y-2.5">
          {['Missing performance metrics', 'No bottleneck classification', 'No verification step'].map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-primary/5 p-4">
        <p className="text-xs font-semibold text-primary">Better answer preview</p>
        <p className="mt-2 text-sm leading-6 text-foreground/75">
          I&apos;d start by capturing a performance profile in React DevTools to identify wasted renders...
        </p>
        <Link href="/demo" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
          View full feedback <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
