import Link from 'next/link';
import { Crown } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SuccessAutoRefresh } from './success-auto-refresh';

export const metadata = { title: 'Welcome to Pro!' };

export default function UpgradeSuccessPage() {
  return (
    <div className="app-page flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 py-16 text-center">
      <SuccessAutoRefresh />

      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <Crown className="h-8 w-8 text-amber-500" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re on Pro!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Unlimited sessions, full history, and the complete coaching system are now unlocked.
        </p>

        {/* Feature highlights */}
        <ul className="mt-6 space-y-2 rounded-xl border border-border/60 bg-card p-4 text-left text-sm">
          {[
            'Unlimited practice sessions',
            'Mock interview exam mode',
            'AI critique of your components',
            'Full session history & replays',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-foreground/80">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <Link href="/practice/new" className={buttonVariants({ className: 'mt-6 w-full' })}>
          Start practicing
        </Link>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: 'ghost', className: 'mt-2 w-full' })}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
