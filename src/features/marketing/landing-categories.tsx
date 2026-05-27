const CATEGORIES = [
  'JavaScript',
  'React',
  'Frontend System Design',
  'Web Performance',
  'Browser & Web APIs',
  'Testing',
  'Behavioral & Communication',
];

export function LandingCategories() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Supported interview categories</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick what you want to drill. Mix topics. Filter by difficulty.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm text-foreground/80"
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}
