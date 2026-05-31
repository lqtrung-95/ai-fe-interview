import { AlertTriangle, ArrowRight, BarChart3, Radar, Sparkles, Zap } from 'lucide-react';

const FEATURES = [
  { icon: BarChart3, title: 'Score trend', body: 'Track whether your answers improve across sessions.' },
  { icon: Radar, title: 'Topic breakdown', body: 'Compare React, browser APIs, testing, and performance.' },
  { icon: AlertTriangle, title: 'Technical weak areas', body: 'See the exact concepts missing from recent answers.' },
  { icon: Sparkles, title: 'AI-guided drills', body: 'Practice the follow-up most likely to expose the gap.' },
];

const WEAK_AREAS = [
  {
    topic: 'React rendering',
    score: '2.1',
    gap: 'Did not separate wasted renders from long tasks or layout thrash.',
    width: '42%',
  },
  {
    topic: 'Web Performance',
    score: '2.4',
    gap: 'Skipped INP measurement, Lighthouse CI budgets, and regression gates.',
    width: '48%',
  },
  {
    topic: 'Browser APIs',
    score: '2.8',
    gap: 'No IntersectionObserver threshold or requestIdleCallback trade-off.',
    width: '56%',
  },
];

const RELATED_DRILLS = [
  'Lighthouse CI performance budgets',
  'IntersectionObserver pagination edge cases',
];

export function LandingDashboardPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid items-start gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Personalized dashboard</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Know exactly what to practice next</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Turn interview feedback into a technical practice plan. See the gaps, then launch the drill that targets them.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DashboardMock />
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md shadow-black/5 dark:shadow-black/20">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/30" /><span className="size-2 rounded-full bg-muted-foreground/30" /><span className="size-2 rounded-full bg-muted-foreground/30" /></div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dashboard · performance review</p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-[1.04fr_0.96fr]">
        <WeakAreasPreview />
        <RecommendationsPreview />
      </div>
    </div>
  );
}

function WeakAreasPreview() {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-3.5">
      <Header icon={AlertTriangle} title="Weak Areas" subtitle="Specific gaps from recent answers" tone="amber" />
      <div className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60 bg-card">
        {WEAK_AREAS.map((area) => (
          <div key={area.topic} className="px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[11px] font-semibold">{area.topic}</p>
              <p className="text-[11px] font-bold tabular-nums text-red-500">{area.score}<span className="font-normal text-muted-foreground">/5</span></p>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{area.gap}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-red-500/80" style={{ width: area.width }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsPreview() {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-3.5">
      <Header icon={Sparkles} title="AI Recommendations" subtitle="Built from your latest feedback" tone="primary" />
      <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <p className="text-[9px] font-bold uppercase tracking-wider text-primary">Next technical drill</p>
        <h4 className="mt-2 text-xs font-bold leading-5">Profile React commit cost before memoizing</h4>
        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Use React Profiler and INP traces to isolate render work, handler cost, and layout thrash before choosing a fix.</p>
        <div className="mt-2.5 flex items-center justify-between rounded-md bg-primary px-2.5 py-2 text-[10px] font-semibold text-primary-foreground">
          <span className="flex items-center gap-1.5"><Zap className="size-3" /> Start focused drill</span><ArrowRight className="size-3" />
        </div>
      </div>
      <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Queue next</p>
      {RELATED_DRILLS.map((drill) => (
        <div key={drill} className="flex items-center justify-between gap-2 border-t border-border/60 py-2 first:border-0">
          <p className="text-[10px] font-medium leading-4">{drill}</p><ArrowRight className="size-3 shrink-0 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

function Header({ icon: Icon, subtitle, title, tone }: { icon: typeof Sparkles; subtitle: string; title: string; tone: 'amber' | 'primary' }) {
  const color = tone === 'amber' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary';
  return <div className="flex items-center gap-2"><span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${color}`}><Icon className="size-3.5" /></span><div><h3 className="text-xs font-semibold">{title}</h3><p className="text-[10px] text-muted-foreground">{subtitle}</p></div></div>;
}
