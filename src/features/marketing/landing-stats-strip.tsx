const STATS = [
  { value: '50k+', label: 'Mock Interviews' },
  { value: '94%', label: 'Success Rate' },
  { value: '120+', label: 'Topic Reviews' },
  { value: '24/7', label: 'Coach Availability' },
];

export function LandingStatsStrip() {
  return (
    <section className="border-y border-border/70 bg-card/60">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="text-4xl font-extrabold tracking-tight text-primary">{s.value}</dt>
              <dd className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
