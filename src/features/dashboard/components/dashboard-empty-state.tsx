import Link from 'next/link';
import { BarChart2, Crosshair, Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const UNLOCKS = [
  { icon: TrendingUp, label: 'Score trend',        desc: 'Track your improvement over time' },
  { icon: BarChart2,  label: 'Topic radar',         desc: 'See which areas need the most work' },
  { icon: Crosshair,  label: 'Weak-area coaching',  desc: 'Pinpoint the exact gaps dragging you down' },
  { icon: Lightbulb,  label: 'AI recommendations',  desc: 'Personalised next sessions based on your results' },
];

export function DashboardEmptyState() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 px-8 py-14 text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Zap className="h-6 w-6" />
        </span>
        <p className="text-xl font-bold tracking-tight">Complete your first session to unlock your dashboard</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          One 5-question session is all it takes. Your stats, charts, and recommendations appear immediately after.
        </p>
        <div className="mt-7">
          <Link href="/practice/new" className={buttonVariants({ size: 'lg' })}>
            Start your first session →
          </Link>
        </div>
      </div>

      {/* Greyed-out preview cards showing what will unlock */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {UNLOCKS.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border border-border/40 bg-card/30 p-4 opacity-50"
            aria-hidden="true"
          >
            <Icon className="size-5 text-primary/60" />
            <p className="text-sm font-semibold text-foreground/70">{label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
