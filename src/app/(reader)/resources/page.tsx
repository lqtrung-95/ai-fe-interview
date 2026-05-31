import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ChevronRight, Hash, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Frontend interview preparation resources — handbooks, glossary, and guides.',
};

const RESOURCES = [
  {
    href: '/resources/frontend-system-design',
    label: 'Handbook',
    title: 'Frontend System Design',
    description:
      'RADIO framework, rendering patterns, performance, caching, real-time, and case studies — with diagrams, quizzes, and flashcards.',
    stats: [
      { icon: BookOpen, value: '38 sections' },
      { icon: HelpCircle, value: '51 quizzes' },
    ],
    tags: ['Architecture', 'Performance', 'Case Studies'],
  },
  {
    href: '/resources/glossary',
    label: 'Glossary',
    title: 'Frontend Glossary',
    description:
      '133 terms covering performance metrics, rendering patterns, JS internals, networking, architecture patterns, and more — each linked to the handbook.',
    stats: [
      { icon: Hash, value: '133 terms' },
      { icon: BookOpen, value: '11 categories' },
    ],
    tags: ['Performance', 'Rendering', 'JavaScript', 'Networking'],
  },
];

export default function ResourcesIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Resources
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Study Guides</h1>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
          Deep-dive material built for lasting understanding — not just interview answers.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {RESOURCES.map(r => (
          <Link
            key={r.href}
            href={r.href}
            className="group relative rounded-xl border border-border/60 bg-card p-5 space-y-4
                       hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-200
                       hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]"
          >
            {/* Label chip */}
            <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {r.label}
            </span>

            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold leading-snug">{r.title}</h2>
              <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {r.tags.map(t => (
                <span key={t} className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-1 border-t border-border/40">
              {r.stats.map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-1.5 text-xs text-muted-foreground/70 font-mono">
                  <Icon className="h-3 w-3 shrink-0" />
                  {value}
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
