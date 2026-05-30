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
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Coverage</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
          Supported interview categories
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick what you want to drill. Mix topics. Filter by difficulty.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {CATEGORIES.map((label) => (
          <span
            key={label}
            className="rounded-full border border-border/70 bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
