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
  'How would you measure the impact of the workflow you shipped?',
  'Which performance trade-offs did you make under real traffic?',
];

export function LandingCvPersonalization() {
  return (
    <section className="border-y border-border/50 bg-card/30">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Optional CV personalization</p>
          <h2 className="mt-2 max-w-lg text-3xl font-extrabold tracking-tight">
            Practice questions grounded in work you have actually done
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Add your CV anytime and the coach can turn your projects, roles, and technical background into more relevant interview questions.
          </p>

          <div className="mt-6 space-y-3">
            <Benefit icon={BriefcaseBusiness}>Get questions about real projects and decisions.</Benefit>
            <Benefit icon={Sparkles}>Prepare for follow-ups that probe depth and trade-offs.</Benefit>
            <Benefit icon={ShieldCheck}>Remove your CV anytime. It is optional for every session.</Benefit>
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
          <h3 className="text-sm font-semibold">CV-powered practice</h3>
          <p className="text-xs text-muted-foreground">Your experience becomes interview context.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {EXPERIENCE.map((item) => (
          <div key={item.company} className="rounded-lg border border-border/70 bg-background/70 p-3">
            <p className="text-xs font-semibold">{item.role}</p>
            <p className="mt-0.5 text-[11px] text-primary">{item.company}</p>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.focus}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Personalized question ideas</p>
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
