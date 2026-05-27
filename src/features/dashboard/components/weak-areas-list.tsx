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
    <section className="rounded-lg border border-border/60 bg-card p-4">
      <h2 className="text-sm font-medium">Where to focus</h2>
      {dimensions.length === 0 ? (
        <p className="mt-2 px-2 py-8 text-center text-sm text-muted-foreground">
          Once you have feedback on a few answers, the weakest dimensions land here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {dimensions.map((d) => (
            <li key={d.dimension} className="rounded-md border border-border/60 bg-background p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{d.label}</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {d.avgScore.toFixed(1)} / 5
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{HINTS[d.dimension]}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
