const CATEGORIES = [
  { label: 'JavaScript', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { label: 'React', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { label: 'Frontend System Design', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { label: 'Web Performance', color: 'bg-green-50 text-green-700 border-green-200' },
  { label: 'Browser & Web APIs', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Testing', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Behavioral & Communication', color: 'bg-pink-50 text-pink-700 border-pink-200' },
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
