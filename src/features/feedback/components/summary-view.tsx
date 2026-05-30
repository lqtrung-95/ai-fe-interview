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

function scoreGrade(score: number) {
  if (score >= 4.5) return { label: 'Excellent', color: 'text-emerald-500', bg: 'border-emerald-500/20 bg-emerald-500/5' };
  if (score >= 3.5) return { label: 'Strong', color: 'text-primary', bg: 'border-primary/20 bg-primary/5' };
  if (score >= 2.5) return { label: 'Developing', color: 'text-amber-500', bg: 'border-amber-500/20 bg-amber-500/5' };
  return { label: 'Needs work', color: 'text-rose-500', bg: 'border-rose-500/20 bg-rose-500/5' };
}

export function SummaryView({ summary }: Props) {
  const grade = scoreGrade(summary.overallScore);

  return (
    <article className="space-y-6">
      {/* Score hero */}
      <header className={`rounded-xl border p-6 ${grade.bg}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Session complete
        </p>
        <div className="mt-3 flex items-end gap-3">
          <span className={`text-6xl font-extrabold tabular-nums tracking-tight ${grade.color}`}>
            {summary.overallScore.toFixed(1)}
          </span>
          <span className="mb-2 text-xl text-muted-foreground font-medium">/ 5</span>
          <span className={`mb-2 rounded-md px-2.5 py-1 text-sm font-bold ${grade.color} bg-current/10`}>
            {grade.label}
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryList title="Strong areas" items={summary.strongAreas} variant="positive" />
        <SummaryList title="Weak areas" items={summary.weakAreas} variant="negative" />
        <SummaryList title="Repeated mistakes" items={summary.repeatedMistakes} variant="warning" />
        <SummaryList title="Recommended topics" items={summary.recommendedTopics} variant="neutral" />
      </div>

      <SummaryList title="Action items" items={summary.actionItems} variant="action" />
    </article>
  );
}

type Variant = 'positive' | 'negative' | 'warning' | 'neutral' | 'action';

const VARIANT_STYLES: Record<Variant, { dot: string; header: string }> = {
  positive: { dot: 'bg-emerald-500', header: 'text-emerald-600 dark:text-emerald-400' },
  negative: { dot: 'bg-rose-500', header: 'text-rose-600 dark:text-rose-400' },
  warning:  { dot: 'bg-amber-500', header: 'text-amber-600 dark:text-amber-400' },
  neutral:  { dot: 'bg-primary/60', header: 'text-primary' },
  action:   { dot: 'bg-primary', header: 'text-foreground' },
};

function SummaryList({ title, items, variant }: { title: string; items: string[]; variant: Variant }) {
  const s = VARIANT_STYLES[variant];
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className={`text-sm font-bold ${s.header}`}>{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">None noted.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
