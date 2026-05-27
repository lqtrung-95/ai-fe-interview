interface SummaryData {
  overallScore: number;
  strongAreas: string[];
  weakAreas: string[];
  repeatedMistakes: string[];
  recommendedTopics: string[];
  actionItems: string[];
}

interface Props {
  summary: SummaryData;
}

export function SummaryView({ summary }: Props) {
  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-border/60 bg-card p-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Session summary</p>
        <h1 className="mt-2 text-3xl font-semibold">{summary.overallScore.toFixed(1)} / 5</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryList title="Strong areas" items={summary.strongAreas} />
        <SummaryList title="Weak areas" items={summary.weakAreas} />
        <SummaryList title="Repeated mistakes" items={summary.repeatedMistakes} />
        <SummaryList title="Recommended topics" items={summary.recommendedTopics} />
      </div>

      <SummaryList title="Action items" items={summary.actionItems} />
    </article>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-border/60 bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
