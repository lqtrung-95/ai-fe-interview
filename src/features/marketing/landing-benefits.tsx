const BENEFITS = [
  {
    title: 'Realistic interview questions',
    body: 'Curated from real senior frontend prep — React, JS, performance, browser internals, system design.',
  },
  {
    title: 'Structured, rubric-grounded feedback',
    body: 'Every answer scored across correctness, clarity, depth, trade-offs, and communication. No empty praise.',
  },
  {
    title: 'Senior-level answer examples',
    body: 'See how a strong interview answer is structured — then learn how to push it from mid to senior.',
  },
  {
    title: 'Track progress over time',
    body: 'Topic-level breakdown, score trends, and recommended next sessions based on your weak areas.',
  },
];

export function LandingBenefits() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-6 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-lg border border-border/60 bg-card p-6">
            <h3 className="font-medium">{b.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
