import Link from 'next/link';
import { CheckCircle2, Circle, BookOpen, ArrowRight } from 'lucide-react';
import type { ScheduledQuestion } from '../server/study-plan-scheduler';

interface Props {
  currentDayIndex: number;
  schedule: ScheduledQuestion[];
  studiedIds: Set<string>;
}

export function StudyPlanDaySchedule({ currentDayIndex, schedule, studiedIds }: Props) {
  const overdue = schedule.filter(
    (s) => s.dayIndex < currentDayIndex && !studiedIds.has(s.question.id),
  );
  const today = schedule.filter((s) => s.dayIndex === currentDayIndex);
  const upcoming = schedule
    .filter((s) => s.dayIndex > currentDayIndex && s.dayIndex <= currentDayIndex + 2)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Overdue */}
      {overdue.length > 0 && (
        <Section
          title={`Catch up — ${overdue.length} overdue`}
          accent="amber"
          items={overdue}
          studiedIds={studiedIds}
        />
      )}

      {/* Today */}
      <Section
        title={today.length > 0 ? `Today — ${today.length} question${today.length > 1 ? 's' : ''}` : "Today — all done!"}
        accent="primary"
        items={today}
        studiedIds={studiedIds}
        emptyMessage="Nothing scheduled today. Check upcoming or you're ahead of schedule 🎉"
      />

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Section
          title="Coming up"
          accent="muted"
          items={upcoming}
          studiedIds={studiedIds}
        />
      )}
    </div>
  );
}

const ACCENT_STYLES = {
  primary: {
    heading: 'text-primary',
    bar: 'bg-primary',
    card: 'hover:border-primary/50',
  },
  amber: {
    heading: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    card: 'hover:border-amber-500/50',
  },
  muted: {
    heading: 'text-muted-foreground',
    bar: 'bg-muted-foreground/40',
    card: 'hover:border-border',
  },
};

const DIFFICULTY_BADGE: Record<string, string> = {
  junior: 'bg-green-500/10 text-green-600 dark:text-green-400',
  mid:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  senior: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

function Section({
  title,
  accent,
  items,
  studiedIds,
  emptyMessage,
}: {
  title: string;
  accent: 'primary' | 'amber' | 'muted';
  items: ScheduledQuestion[];
  studiedIds: Set<string>;
  emptyMessage?: string;
}) {
  const s = ACCENT_STYLES[accent];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-1 rounded-full ${s.bar}`} />
        <h2 className={`text-sm font-semibold ${s.heading}`}>{title}</h2>
      </div>

      {items.length === 0 && emptyMessage ? (
        <p className="text-sm text-muted-foreground pl-3">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ question: q }) => {
            const studied = studiedIds.has(q.id);
            return (
              <li key={q.id}>
                <Link
                  href={`/question-bank/${q.id}`}
                  className={`group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 transition-all ${s.card}`}
                >
                  {/* Studied indicator */}
                  <span className="mt-0.5 shrink-0">
                    {studied
                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                      : <Circle className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                    }
                  </span>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`text-sm leading-snug line-clamp-2 ${studied ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground'}`}>
                      {q.question}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{q.topic}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_BADGE[q.difficulty] ?? ''}`}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
