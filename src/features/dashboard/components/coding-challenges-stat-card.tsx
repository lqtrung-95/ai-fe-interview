import Link from 'next/link';
import { Code2 } from 'lucide-react';

interface Props {
  solved: number;
  total: number;
}

export function CodingChallengesStatCard({ solved, total }: Props) {
  return (
    <Link
      href="/coding-challenges"
      className="app-surface-card flex items-center gap-4 rounded-xl border border-border/60 bg-card/90 p-5 backdrop-blur-sm transition-all duration-150 hover:border-primary/30 hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
        <Code2 className="h-5 w-5 text-sky-500" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">Coding Challenges</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
          {solved}
          <span className="text-sm font-normal text-muted-foreground"> / {total} solved</span>
        </p>
      </div>
    </Link>
  );
}
