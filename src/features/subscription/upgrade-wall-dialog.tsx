'use client';

import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRO_PERKS = [
  'Unlimited practice sessions',
  'Full session history & replays',
  'Spaced repetition study plan',
  'Voice answer input',
  'Per-dimension weak-area coaching',
];

export function UpgradeWallDialog({ open, onClose }: Props) {
  if (!open) return null;

  const monthlyId = process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
  const lifetimeId = process.env.NEXT_PUBLIC_POLAR_LIFETIME_PRODUCT_ID;

  const monthlyUrl = monthlyId ? `/api/checkout?products=${monthlyId}` : '/upgrade';
  const lifetimeUrl = lifetimeId ? `/api/checkout?products=${lifetimeId}` : '/upgrade';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-3">
          <Zap className="h-5 w-5 text-primary" />
        </div>

        <h2 className="text-base font-semibold leading-snug">
          You've used today's free session
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Free accounts get 1 practice session per day. Upgrade to Pro for unlimited sessions
          and the full coaching suite.
        </p>

        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {PRO_PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2">
          <Button className="w-full" onClick={() => { window.location.href = lifetimeUrl; }}>
            Buy lifetime — $19 one-time
          </Button>
          <Button variant="outline" className="w-full" onClick={() => { window.location.href = monthlyUrl; }}>
            Subscribe — $5 / month
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe tomorrow
          </Button>
        </div>
      </div>
    </div>
  );
}
