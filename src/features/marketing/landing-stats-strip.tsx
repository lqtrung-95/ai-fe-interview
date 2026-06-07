const FACTS = [
  { value: '7', label: 'Frontend topic areas' },
  { value: '6', label: 'Feedback dimensions' },
  { value: '3', label: 'Pro saved target JDs' },
  { value: '1', label: 'Free session to start' },
];

export function LandingStatsStrip() {
  return (
    <section className="marketing-stats border-y border-border/70 bg-card/60">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label} className="text-center">
              <dt className="marketing-gradient-text text-3xl font-extrabold tracking-tight">{fact.value}</dt>
              <dd className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
