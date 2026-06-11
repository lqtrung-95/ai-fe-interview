/** Skeleton for the public /questions hub while topic data loads. */
export default function Loading() {
  return (
    <div className="reader-page mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-muted/70" />
        <div className="h-7 w-72 animate-pulse rounded bg-muted/70" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted/50" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-muted/60" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-muted/60" />
        <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/80">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-4 flex-1 animate-pulse rounded bg-muted/50" />
              <div className="h-5 w-12 animate-pulse rounded bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
