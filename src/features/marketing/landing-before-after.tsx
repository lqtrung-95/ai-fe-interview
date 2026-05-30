import { XCircle, CheckCircle2 } from 'lucide-react';

const WEAK_GAPS = ['No mention of fiber architecture', 'Missing key-prop heuristic', 'No depth on batching or lanes'];
const STRONG_POINTS = ['Explains fiber + incremental work', 'Keys prevent O(n³) comparison', 'Covers concurrent mode tradeoffs'];

export function LandingBeforeAfter() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">See the difference</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
          From average to senior-level
        </h2>
        <p className="mt-3 text-sm max-w-md mx-auto text-muted-foreground">
          Every answer gets scored, gap-analysed, and rewritten at senior level so you know exactly what to improve.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-border/70 bg-card px-5 py-3.5 text-center text-sm font-medium shadow-sm">
        <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question</span>
        How does React's reconciliation algorithm work?
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
              <XCircle className="h-4 w-4" /> Typical answer
            </span>
            <span className="rounded-md bg-destructive/10 px-2.5 py-1 text-sm font-bold text-destructive">
              2.1 / 5
            </span>
          </div>
          <p className="border-l-2 border-destructive/30 pl-3 text-sm leading-relaxed text-foreground/80 italic">
            "React updates the DOM when state changes. It compares the old and new virtual DOM and only updates what changed. This makes it faster than updating the whole page."
          </p>
          <ul className="mt-5 space-y-2">
            {WEAK_GAPS.map((g) => (
              <li key={g} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-primary/25 bg-primary/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" /> Senior-level answer
            </span>
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
              4.7 / 5
            </span>
          </div>
          <p className="border-l-2 border-primary/30 pl-3 text-sm leading-relaxed text-foreground/80 italic">
            "React's reconciler uses a fiber architecture for incremental work. It diffs a work-in-progress tree against the current tree — elements of different types unmount/remount, same types update in place. Keys give stable identity across re-renders, avoiding O(n³) list comparison. In concurrent mode, this work is interruptible via lanes..."
          </p>
          <ul className="mt-5 space-y-2">
            {STRONG_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
