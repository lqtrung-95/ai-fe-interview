import { MessageSquare, ClipboardCheck, Award, TrendingUp } from 'lucide-react';

const BENEFITS = [
  {
    icon: MessageSquare,
    title: 'Realistic interview questions',
    body: 'Curated from real senior frontend prep — React, JS, performance, browser internals, system design.',
  },
  {
    icon: ClipboardCheck,
    title: 'Structured, rubric-grounded feedback',
    body: 'Every answer scored across correctness, clarity, depth, trade-offs, and communication. No empty praise.',
  },
  {
    icon: Award,
    title: 'Senior-level answer examples',
    body: 'See how a strong interview answer is structured — then learn how to push it from mid to senior.',
  },
  {
    icon: TrendingUp,
    title: 'Track progress over time',
    body: 'Topic-level breakdown, score trends, and recommended next sessions based on your weak areas.',
  },
];

export function LandingBenefits() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid overflow-hidden rounded-lg border border-border/70 bg-card sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="group border-border/70 p-6 transition-colors hover:bg-muted/40 sm:border-r">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
