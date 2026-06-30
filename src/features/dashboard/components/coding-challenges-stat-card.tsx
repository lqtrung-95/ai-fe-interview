import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  solved: number;
  total: number;
}

export function CodingChallengesStatCard({ solved, total }: Props) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const remaining = total - solved;

  return (
    <section className="app-surface-card flex h-full flex-col rounded-xl border border-border/60 bg-card/90 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-500/10">
          <Code2 className="h-3.5 w-3.5 text-sky-500" />
        </span>
        <h3 className="text-sm font-semibold">Coding Challenges</h3>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums leading-none">{solved}</span>
        <span className="pb-0.5 text-sm text-muted-foreground">/ {total} solved</span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{pct}% complete</span>
          <span className="tabular-nums">{remaining} left</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Link
          href="/coding-challenges"
          className={`w-full ${buttonVariants({ variant: 'outline', size: 'sm' })}`}
        >
          {solved === 0 ? 'Start first challenge →' : 'Browse challenges'}
        </Link>
      </div>
    </section>
  );
}
