import { ArrowRight, CheckCircle2, Circle, LineChart, MessageSquareText } from 'lucide-react';

const FLOWS = [
  {
    title: 'Start with a focused session',
    body: 'Choose a standard mock, a quick drill, or a deep coaching pass. The setup keeps the interview scoped to the topics you need.',
    preview: <SetupPreview />,
  },
  {
    title: 'Practice in an interview-style workspace',
    body: 'Answer one question at a time with progress, guide rails, hints, and space to write a structured response.',
    preview: <InterviewPreview />,
  },
  {
    title: 'Turn feedback into the next drill',
    body: 'Every answer produces dimension scores, missed points, a better answer, and recommended next sessions.',
    preview: <FeedbackPreview />,
  },
];

export function LandingProductWalkthrough() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product walkthrough</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Learn by doing, not by reading notes</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          The landing page should show the real loop inside the app: setup, answer, review, repeat.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {FLOWS.map((flow, index) => (
          <article
            key={flow.title}
            className="grid items-center gap-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm lg:grid-cols-2"
          >
            <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Step {index + 1}</span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">{flow.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{flow.body}</p>
              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                See the workflow <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            {flow.preview}
          </article>
        ))}
      </div>
    </section>
  );
}

function SetupPreview() {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {['Quick drill', 'Standard mock', 'Deep coaching'].map((mode, i) => (
          <div key={mode} className={`rounded-lg border p-3 ${i === 1 ? 'border-primary bg-primary/5' : 'border-border/70 bg-card'}`}>
            <p className="text-sm font-semibold">{mode}</p>
            <p className="mt-1 text-xs text-muted-foreground">{i === 1 ? '5 questions · 25 min' : 'Targeted practice'}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        {['JavaScript', 'Web Performance', 'Frontend System Design'].map((topic) => (
          <div key={topic} className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2">
            <span className="text-sm">{topic}</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewPreview() {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="rounded-lg border border-border/70 bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground">Question 1 of 5</p>
        <p className="mt-2 text-sm font-semibold">Explain how React reconciliation uses keys during list updates.</p>
      </div>
      <div className="mt-3 rounded-lg border border-border/70 bg-card p-4">
        <div className="flex gap-2 text-muted-foreground">
          <MessageSquareText className="h-4 w-4" />
          <span className="text-xs">Your answer</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 rounded bg-muted" />
          <div className="h-2 w-4/5 rounded bg-muted" />
          <div className="h-2 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function FeedbackPreview() {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="grid grid-cols-3 gap-3">
        {['Correctness', 'Depth', 'Communication'].map((label, i) => (
          <div key={label} className="rounded-lg border border-border/70 bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-lg font-bold">{i === 0 ? '4' : '3'} / 5</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-border/70 bg-card p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <LineChart className="h-4 w-4" />
          Recommended next sessions
        </div>
        {['React performance', 'Browser APIs'].map((item) => (
          <div key={item} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="h-3 w-3" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
