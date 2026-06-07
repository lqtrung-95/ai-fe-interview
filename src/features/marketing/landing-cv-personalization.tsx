import { BriefcaseBusiness, CheckCircle2, FileText, ShieldCheck, Sparkles } from 'lucide-react';

const EXPERIENCE = [
  {
    role: 'Frontend Engineer',
    company: 'Fintech platform',
    focus: 'Built verification workflows and internal review tools.',
  },
  {
    role: 'Software Engineer',
    company: 'Consumer product',
    focus: 'Improved frontend performance across high-traffic flows.',
  },
];

const QUESTIONS = [
  'How would you design resilient checkout UI for a marketplace with strict latency goals?',
  'Which trade-offs from your performance work apply to this target role?',
];

export function LandingCvPersonalization() {
  return (
    <section className="border-y border-border/50 bg-card/30">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Personalization</p>
          <h2 className="mt-2 max-w-lg text-3xl font-extrabold tracking-tight">
            Practice with CV context, then upgrade for JD targeting
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Add your CV for experience-based prompts. Pro adds saved job descriptions so sessions can probe a specific role, company domain, and expected stack.
          </p>

          <div className="mt-6 space-y-3">
            <Benefit icon={BriefcaseBusiness}>Pro users can save up to 3 target JDs for role-specific practice.</Benefit>
            <Benefit icon={Sparkles}>Blend CV context with JD requirements when you want sharper prompts.</Benefit>
            <Benefit icon={ShieldCheck}>CV use is optional per session and can be removed anytime.</Benefit>
          </div>
        </div>

        <CvPreview />
      </div>
    </section>
  );
}

function CvPreview() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-md shadow-black/5 dark:shadow-black/20">
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Role-aware practice</h3>
          <p className="text-xs text-muted-foreground">Your CV is optional. Saved target JDs are Pro.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold">Pro target job</p>
          <p className="mt-0.5 text-[11px] text-primary">Senior Frontend Engineer</p>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            Marketplace, search, checkout, React, performance budgets.
          </p>
        </div>
        {EXPERIENCE.map((item) => (
          <div key={item.company} className="rounded-lg border border-border/70 bg-background/70 p-3">
            <p className="text-xs font-semibold">{item.role}</p>
            <p className="mt-0.5 text-[11px] text-primary">{item.company}</p>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.focus}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Tailored question ideas</p>
        <div className="mt-2.5 space-y-2">
          {QUESTIONS.map((question) => (
            <p key={question} className="flex gap-2 text-xs leading-5 text-foreground/80">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {question}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Benefit({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Sparkles }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-foreground/80">
      <Icon className="size-4 shrink-0 text-primary" />
      <p>{children}</p>
    </div>
  );
}
