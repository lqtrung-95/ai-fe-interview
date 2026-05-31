export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-muted/40" />
        <div className="h-7 w-48 rounded bg-muted/40" />
        <div className="h-4 w-80 rounded bg-muted/30" />
      </div>
      <div className="rounded-xl border border-border/40 bg-card/50 p-10 flex flex-col items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-muted/40" />
        <div className="h-5 w-52 rounded bg-muted/40" />
        <div className="h-4 w-72 rounded bg-muted/30" />
        <div className="h-10 w-40 rounded-lg bg-muted/40 mt-2" />
      </div>
    </div>
  );
}
