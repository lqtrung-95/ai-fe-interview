import { redirect } from 'next/navigation';
import { Check, Zap } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { buttonVariants } from '@/components/ui/button';

const PRO_FEATURES = [
  'Unlimited practice sessions',
  'Full session history & replays',
  'Spaced repetition study plan',
  'Voice answer input',
  'Per-dimension weak-area coaching',
  'Priority AI responses',
];

export const metadata = { title: 'Upgrade to Pro' };

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=/upgrade');
  if (user.isPro) redirect('/dashboard');

  const monthlyId = process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
  const lifetimeId = process.env.NEXT_PUBLIC_POLAR_LIFETIME_PRODUCT_ID;

  const monthlyUrl = monthlyId ? `/api/checkout?products=${monthlyId}` : '#';
  const lifetimeUrl = lifetimeId ? `/api/checkout?products=${lifetimeId}` : '#';

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Upgrade to Pro</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unlock unlimited sessions and the full coaching system.
        </p>
      </div>

      {/* Feature list shared by both plans */}
      <ul className="mb-8 grid sm:grid-cols-2 gap-x-6 gap-y-2">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Monthly */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Monthly</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-extrabold">$5</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          <p className="text-xs text-muted-foreground mb-6 flex-1">Cancel any time.</p>
          <a href={monthlyUrl} className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
            Subscribe monthly
          </a>
        </div>

        {/* Lifetime */}
        <div className="relative flex flex-col rounded-xl border-2 border-primary/45 bg-card p-6 shadow-sm">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground">
            Best value
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Lifetime</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-extrabold">$19</span>
            <span className="text-sm text-muted-foreground">one-time</span>
          </div>
          <p className="text-xs text-muted-foreground mb-6 flex-1">Pay once, prep forever.</p>
          <a href={lifetimeUrl} className={buttonVariants({ className: 'w-full' })}>
            Buy lifetime access
          </a>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Secure checkout via Polar. No hidden fees.
      </p>
    </div>
  );
}
