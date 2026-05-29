import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronLeft, BookOpen, Zap } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import { getStudyQuestion } from '@/features/study/server/study-service';
import { getStudyPlanStatus } from '@/features/study-plan/server/study-plan-service';
import { Eli5Card } from '@/features/study/components/eli5-card';
import { StudyDetailProse } from '@/features/study/components/study-detail-prose';
import { StudyDiagram } from '@/features/study/components/study-diagram';
import { StudyDiagramMermaid } from '@/features/study/components/study-diagram-mermaid';
import { QuizCard, type QuizData } from '@/features/study/components/quiz-card';
import { MarkStudiedButton } from '@/features/study-plan/components/mark-studied-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const q = await getStudyQuestion(id);
  if (!q) return { title: 'Not found' };
  return { title: q.question.slice(0, 80) };
}

const DIFFICULTY_STYLES: Record<string, string> = {
  junior: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  mid:    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  senior: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  conceptual:    'Conceptual',
  debugging:     'Debugging',
  system_design: 'System design',
  behavioral:    'Behavioral',
  tradeoff:      'Trade-off',
};

export default async function QuestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [user, q] = await Promise.all([requireUser(), getStudyQuestion(id)]);
  if (!q) notFound();

  const { hasPlan, studiedIds } = await getStudyPlanStatus(user.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      {/* Back nav */}
      <Link
        href="/question-bank"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Question Bank
      </Link>

      {/* Question header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {q.topic}
          </span>
          {q.subtopic && q.subtopic !== q.topic && q.subtopic.length <= 60 && (
            <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
              {q.subtopic}
            </span>
          )}
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${DIFFICULTY_STYLES[q.difficulty] ?? ''}`}
          >
            {q.difficulty}
          </span>
          <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
            {TYPE_LABELS[q.type] ?? q.type}
          </span>
        </div>

        <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground">
          {q.question}
        </h1>
      </div>

      {/* Mark as studied */}
      <MarkStudiedButton
        seedQuestionId={q.id}
        initialStudied={studiedIds.has(q.id)}
        hasPlan={hasPlan}
      />

      {/* ELI5 */}
      {q.childExplanation && <Eli5Card explanation={q.childExplanation} />}

      {/* Detailed explanation */}
      {q.detailedExplanation && (
        <section className="space-y-3">
          <SectionHeading icon={<BookOpen className="h-4 w-4" />} title="Full explanation" />
          <div className="rounded-xl border border-border/70 bg-card p-6">
            <StudyDetailProse html={q.detailedExplanation} />
          </div>
        </section>
      )}

      {/* Diagram: hand-crafted SVG takes priority; Mermaid is the fallback */}
      {(q.diagramSvg || q.diagramMermaid) && (
        <section className="space-y-3">
          <SectionHeading title="Diagram" />
          {q.diagramSvg ? (
            <StudyDiagram svgHtml={q.diagramSvg} />
          ) : (
            <StudyDiagramMermaid source={q.diagramMermaid!} />
          )}
        </section>
      )}

      {/* What interviewers look for */}
      {q.expectedPoints.length > 0 && (
        <section className="space-y-3">
          <SectionHeading title="What interviewers look for" />
          <div className="rounded-xl border border-border/70 bg-card p-5">
            <ul className="space-y-2.5">
              {q.expectedPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Follow-up questions */}
      {q.followUps.length > 0 && (
        <section className="space-y-3">
          <SectionHeading title="Follow-up questions" />
          <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60">
            {q.followUps.map((fu, i) => (
              <div key={i} className="px-5 py-3.5 text-sm text-muted-foreground">
                {fu}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick-check quiz */}
      {(() => {
        if (!q.quiz) return null;
        try {
          const quiz = JSON.parse(q.quiz) as QuizData;
          return (
            <section className="space-y-3">
              <QuizCard quiz={quiz} />
            </section>
          );
        } catch { return null; }
      })()}

      {/* CTA */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <Zap className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Ready to practice this?</p>
          <p className="text-xs text-muted-foreground">
            Start a mock interview session and get AI feedback on your answer.
          </p>
        </div>
        <Link
          href="/practice/new"
          className={buttonVariants({ size: 'sm' })}
        >
          Practice now
        </Link>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {icon}
      {title}
    </h2>
  );
}
