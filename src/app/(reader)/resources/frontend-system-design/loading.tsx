export default function Loading() {
  return (
    <div className="flex min-h-screen animate-pulse">
      {/* Sidebar skeleton */}
      <div className="hidden md:block w-60 shrink-0 border-r border-border/40 bg-muted/10" />

      {/* Content skeleton */}
      <div className="flex-1 px-8 py-10 space-y-6 max-w-3xl">
        <div className="h-3 w-28 rounded bg-muted/40" />
        <div className="h-9 w-96 rounded bg-muted/40" />
        <div className="h-4 w-64 rounded bg-muted/30" />
        <div className="flex gap-8 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-7 w-12 rounded bg-muted/40" />
              <div className="h-3 w-16 rounded bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
