import Link from 'next/link';
import { ArrowRight, Code2 } from 'lucide-react';

interface Props {
  solved: number;
  total: number;
}

export function CodingChallengesStatCard({ solved, total }: Props) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const remaining = total - solved;

  return (
    <section className="app-surface-card flex flex-col rounded-xl border border-border/60 bg-card/90 p-5 backdrop-blur-sm">
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

      <Link
        href="/coding-challenges"
        className="mt-auto pt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-sky-500/30 hover:text-sky-400"
      >
        {solved === 0 ? 'Start first challenge' : 'Browse challenges'}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
