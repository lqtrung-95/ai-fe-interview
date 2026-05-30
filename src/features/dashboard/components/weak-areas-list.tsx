import type { DimensionAverage } from '../dashboard-types';

const HINTS: Record<DimensionAverage['dimension'], string> = {
  correctness: 'Tighten technical accuracy — verify claims with examples.',
  completeness: 'Cover more of the expected points before moving on.',
  clarity: 'Lead with the conclusion, then back it up.',
  depth: 'Add a layer — implementation detail, edge case, or real metric.',
  tradeoffThinking: 'Name the alternative you rejected and why.',
  communication: 'Use a structured frame: situation → action → result.',
};

interface Props {
  dimensions: DimensionAverage[];
}

export function WeakAreasList({ dimensions }: Props) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-sm font-semibold tracking-tight">Where to focus</h2>
      {dimensions.length === 0 ? (
        <p className="mt-2 px-2 py-8 text-center text-sm text-muted-foreground">
          Once you have feedback on a few answers, the weakest dimensions land here.
        </p>
      ) : (
        <ul className="mt-3.5 space-y-2">
          {dimensions.map((d) => {
            const pct = (d.avgScore / 5) * 100;
            return (
              <li key={d.dimension} className="rounded-lg border border-border/50 bg-background/60 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold">{d.label}</p>
                  <p className="text-xs font-bold tabular-nums text-primary">
                    {d.avgScore.toFixed(1)}<span className="text-muted-foreground font-normal"> / 5</span>
                  </p>
                </div>
                {/* Score bar */}
                <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{HINTS[d.dimension]}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
