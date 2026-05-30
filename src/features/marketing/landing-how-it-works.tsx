import { Bot, ClipboardCheck, Target } from 'lucide-react';

const STEPS = [
  {
    icon: Target,
    title: 'Choose your interview focus',
    body: 'Pick mode, seniority, and frontend topics so every session starts with the right level of pressure.',
  },
  {
    icon: Bot,
    title: 'Answer realistic questions',
    body: 'Work through focused prompts across React, JavaScript, browser APIs, performance, testing, and system design.',
  },
  {
    icon: ClipboardCheck,
    title: 'Get a senior-level review',
    body: 'See rubric scores, missing points, better-answer rewrites, and the next session to run.',
  },
];

export function LandingHowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">A mock interview loop you can repeat</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            The product is built around one habit: answer, review, and drill the next weak spot.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-xl border border-border/70 bg-background/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
