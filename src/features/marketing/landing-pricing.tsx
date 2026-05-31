import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const FREE_FEATURES = [
  '1 practice session / day',
  '250+ questions in the bank and growing',
  'AI feedback on every answer',
  'Basic score breakdown',
];

const PRO_FEATURES = [
  'Unlimited practice sessions',
  'Full session history & replays',
  'Spaced repetition study plan',
  'Voice answer input',
  'Per-dimension weak-area coaching',
  'Priority AI responses',
];

interface Props {
  ctaHref?: string;
}

export function LandingPricing({ ctaHref = '/sign-in?next=/onboarding' }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pricing</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
          Start free. Upgrade when it clicks.
        </h2>
        <p className="mt-3 text-sm max-w-sm mx-auto text-muted-foreground">
          No credit card to get started. Upgrade only if you want unlimited sessions and the full study system.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
        <div className="flex flex-col rounded-xl border border-border bg-card p-7 shadow-md shadow-black/5 dark:shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Free</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">$0</span>
            <span className="text-sm text-muted-foreground">forever</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Good for trying it out.</p>

          <ul className="mt-6 flex-1 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={ctaHref}
            className={buttonVariants({ variant: 'outline', className: 'mt-8 w-full' })}
          >
            Get started free
          </Link>
        </div>

        <div className="relative flex flex-col rounded-xl border-2 border-primary/45 bg-card p-7 shadow-md shadow-black/5 dark:shadow-black/20">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground">
            Most popular
          </span>

          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Pro</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">$5</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Or <span className="font-semibold text-foreground">$19 one-time</span> — pay once, prep forever.
          </p>

          <ul className="mt-6 flex-1 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={ctaHref}
            className={buttonVariants({ className: 'mt-8 w-full' })}
          >
            Start free → upgrade anytime
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        No subscription traps. Cancel or keep free tier anytime.
      </p>
    </section>
  );
}
