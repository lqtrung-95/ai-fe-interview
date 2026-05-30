import Link from 'next/link';
import { Zap } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function LandingHero({ ctaHref = '/sign-in?next=/onboarding' }: { ctaHref?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
        <Zap className="h-3 w-3" />
        AI-powered · Free to start
      </div>

      <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
        Master your Frontend{' '}
        <span className="italic text-primary">Interview</span>{' '}
        with AI
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        Prepare with high-fidelity realistic sessions and personalised study plans. Our AI evaluates your React architecture, JS fundamentals, and behavioural signals in real-time.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
          View Sample Feedback
        </Link>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        No credit card required · Takes 5 minutes
      </p>

      <div className="mt-16 relative">
        <div className="absolute bottom-0 left-1/2 -z-10 h-32 w-3/4 -translate-x-1/2 rounded-full bg-primary/10 blur-[60px]" />
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm backdrop-blur">
          <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="mx-auto rounded-md border border-border/70 bg-muted/40 px-16 py-0.5 text-[11px] text-muted-foreground">
              app.frontendcoach.ai
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 p-6 text-left">
            <div className="col-span-2 rounded-xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Score Trend · 30 days</p>
              <div className="mt-3 flex items-end gap-1 h-16">
                {[30,45,38,55,48,60,52,68,62,75,70,82].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${i === 11 ? 'bg-primary' : 'bg-primary/20'}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Avg score</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+12% vs last week</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/60 p-4 flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Topic Radar</p>
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <polygon points="50,5 95,27.5 80,87.5 20,87.5 5,27.5" className="fill-primary/10 stroke-primary/30" strokeWidth="1.5"/>
                  <polygon points="50,20 78,35 68,72 32,72 22,35" className="fill-emerald-500/15 stroke-emerald-500" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {['React','JS','Perf'].map(t => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>

            <div className="col-span-3 rounded-xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Latest feedback · How does React reconciliation work?</p>
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs leading-5 text-muted-foreground flex-1">
                  Strong explanation of the fiber architecture. Missing the key-prop heuristic and concurrent mode tradeoffs — add those and this hits senior level.
                </p>
                <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  3.8 / 5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
