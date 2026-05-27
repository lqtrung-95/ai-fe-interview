import { Badge } from '@/components/ui/badge';
import { FeedbackCard } from '@/features/feedback/components/feedback-card';
import { SummaryView } from '@/features/feedback/components/summary-view';
import type { getSessionDetail } from '../server/history-service';

type SessionDetailData = NonNullable<Awaited<ReturnType<typeof getSessionDetail>>>;

interface Props {
  session: SessionDetailData;
}

export function SessionDetail({ session }: Props) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{session.mode.replace('_', ' ')}</Badge>
          <Badge variant="secondary">{session.status.replace('_', ' ')}</Badge>
          <Badge variant="outline">{session.difficulty}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{session.topics.join(' + ')}</h1>
        <p className="text-sm text-muted-foreground">
          Started {session.startedAt.toLocaleString()}
        </p>
      </header>

      {session.summary && <SummaryView summary={session.summary} />}

      <section className="space-y-6">
        {session.questions.map((question) => (
          <article key={question.id} className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Question {question.order + 1} · {question.topic}
              </p>
              <h2 className="mt-2 text-lg font-medium leading-relaxed">{question.question}</h2>
              {question.answer && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                  {question.answer.answer}
                </p>
              )}
            </div>
            {question.answer?.feedback && <FeedbackCard feedback={question.answer.feedback} />}
          </article>
        ))}
      </section>
    </div>
  );
}
