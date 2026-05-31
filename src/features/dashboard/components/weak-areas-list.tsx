import { AlertTriangle } from 'lucide-react';
import type { TopicWeakArea } from '../dashboard-types';

interface Props {
  weakAreas: TopicWeakArea[];
}

export function WeakAreasList({ weakAreas }: Props) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
          <AlertTriangle className="size-3.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Weak Areas</h2>
          <p className="text-xs text-muted-foreground">Topics where you score lowest, with what's missing.</p>
        </div>
      </div>

      {weakAreas.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Once you have feedback on a few answers, your weakest topics appear here.
          </p>
        </div>
      ) : (
        <ul className="grid flex-1 auto-rows-fr gap-2">
          {weakAreas.map((area) => (
            <li key={area.topic} className="flex flex-col justify-between rounded-lg border border-border/50 bg-muted/15 px-3.5 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500/80" />
                <div className="min-w-0 flex-1">
                  {/* Topic name + score */}
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{area.topic}</p>
                    <p className="shrink-0 text-xs font-bold tabular-nums text-red-500">
                      {area.avgScore.toFixed(1)}<span className="font-normal text-muted-foreground">/5</span>
                    </p>
                  </div>

                  {/* Specific gap from real feedback — or a generic prompt */}
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {area.specificGap ?? 'Consistently lower than your other topics — worth focused practice.'}
                  </p>

                  {/* Answer count context */}
                  <p className="mt-1.5 text-[10px] text-muted-foreground/50">
                    {area.answers} answer{area.answers === 1 ? '' : 's'} scored
                  </p>
                </div>
              </div>
              {/* Score bar */}
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-red-500/70 transition-all"
                  style={{ width: `${Math.max(0, Math.min(area.avgScore / 5, 1)) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
