const CATEGORIES = [
  { label: 'JavaScript', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300' },
  { label: 'React', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
  { label: 'Frontend System Design', color: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  { label: 'Web Performance', color: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300' },
  { label: 'Browser & Web APIs', color: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  { label: 'Testing', color: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  { label: 'Behavioral & Communication', color: 'border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-300' },
];

export function LandingCategories() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Supported interview categories</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick what you want to drill. Mix topics. Filter by difficulty.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {CATEGORIES.map((c) => (
          <span
            key={c.label}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${c.color}`}
          >
            {c.label}
          </span>
        ))}
      </div>
    </section>
  );
}
