import { ArrowRight, BarChart3, Crosshair, Radar, Sparkles } from 'lucide-react';

const BARS = [36, 48, 42, 58, 54, 66, 61, 72, 68, 82];
const FEATURES = [
  { icon: BarChart3, title: 'Score trend', body: 'Track how your interview scores improve over time.' },
  { icon: Radar, title: 'Topic breakdown', body: 'Compare React, JavaScript, browser APIs, and performance.' },
  { icon: Crosshair, title: 'Where to focus', body: 'See which answer dimensions need more depth.' },
  { icon: Sparkles, title: 'Recommended sessions', body: 'Turn weak spots into your next targeted drill.' },
];

export function LandingDashboardPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid items-start gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Personalized dashboard</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Know exactly what to practice next</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Your interview history becomes a focused improvement plan. Track progress, spot weak areas, and start the next drill without guessing.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{feature.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DashboardMock />
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-md shadow-black/5 dark:shadow-black/20">
      <div className="grid gap-3 md:grid-cols-2">
        <ScoreTrend />
        <TopicBreakdown />
        <FocusAreas />
        <RecommendedSessions />
      </div>
    </div>
  );
}

function ScoreTrend() {
  return (
    <PreviewCard title="Score trend">
      <div className="flex h-24 items-end gap-1.5">
        {BARS.map((height, index) => (
          <span
            key={index}
            className={`flex-1 rounded-t-sm ${index === BARS.length - 1 ? 'bg-primary' : 'bg-primary/25'}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Last 30 days</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">+12% improvement</span>
      </div>
    </PreviewCard>
  );
}

function TopicBreakdown() {
  return (
    <PreviewCard title="Topic breakdown">
      <div className="flex items-center justify-center py-1">
        <svg viewBox="0 0 120 110" className="h-24 w-28">
          <polygon points="60,5 112,42 92,104 28,104 8,42" className="fill-primary/10 stroke-primary/30" />
          <polygon points="60,20 92,48 78,88 38,91 25,47" className="fill-primary/20 stroke-primary" />
        </svg>
      </div>
      <div className="flex flex-wrap gap-1">
        {['React', 'JS', 'Perf', 'Browser APIs'].map((topic) => (
          <span key={topic} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{topic}</span>
        ))}
      </div>
    </PreviewCard>
  );
}

function FocusAreas() {
  return (
    <PreviewCard title="Where to focus">
      <div className="space-y-3">
        {[
          ['Completeness', 68],
          ['Depth', 76],
          ['Communication', 86],
        ].map(([label, width]) => (
          <div key={label}>
            <div className="flex justify-between text-[11px]">
              <span>{label}</span>
              <span className="text-muted-foreground">{Number(width) / 20} / 5</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${width}%` }} />
            </div>
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

function RecommendedSessions() {
  return (
    <PreviewCard title="Recommended sessions">
      <div className="space-y-2">
        {['React performance', 'Browser API debugging', 'Testing trade-offs'].map((topic) => (
          <div key={topic} className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-card px-2.5 py-2">
            <span className="truncate text-[11px] font-medium">{topic}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

function PreviewCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-3.5">
      <h3 className="mb-3 text-xs font-semibold">{title}</h3>
      {children}
    </div>
  );
}
