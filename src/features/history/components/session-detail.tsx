import { Badge } from '@/components/ui/badge';
import { SummaryView } from '@/features/feedback/components/summary-view';
import { SessionQuestionBreakdown } from '@/features/feedback/components/session-question-breakdown';
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

      <SessionQuestionBreakdown questions={session.questions} />
    </div>
  );
}
