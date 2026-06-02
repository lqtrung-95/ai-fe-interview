import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SCORE_LABELS = ['Correctness', 'Completeness', 'Depth', 'Trade-offs', 'Communication', 'Production'];

export function FeedbackLoadingState() {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-card">
      <div className="h-1 overflow-hidden bg-primary/10">
        <div className="h-full w-2/3 animate-pulse rounded-r-full bg-primary/70" />
      </div>
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4 animate-pulse" />
          </span>
          <div>
            <p className="text-sm font-semibold">Generating feedback</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Scoring your answer and preparing a stronger version.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SCORE_LABELS.map((label) => (
            <div key={label} className="rounded-lg border border-border/50 bg-muted/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <AnalysisBlock title="Reviewing your answer" />
          <AnalysisBlock title="Building a senior-level rewrite" />
        </div>
      </div>
    </section>
  );
}

function AnalysisBlock({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
      <p className="text-xs font-semibold">{title}</p>
      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}
