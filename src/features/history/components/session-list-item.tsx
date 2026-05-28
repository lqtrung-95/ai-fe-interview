import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Props {
  session: {
    id: string;
    mode: string;
    topics: string[];
    status: string;
    overallScore: number | null;
    startedAt: Date;
    completedAt: Date | null;
    questions: unknown[];
  };
}

export function SessionListItem({ session }: Props) {
  return (
    <Link
      href={`/history/${session.id}`}
      className="block border-b border-border/70 bg-card p-5 transition-colors last:border-b-0 hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{session.mode.replace('_', ' ')}</Badge>
            <Badge variant="secondary">{session.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{session.topics.join(' + ')}</p>
          <p className="text-xs text-muted-foreground">
            {session.startedAt.toLocaleDateString()} · {session.questions.length} questions
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {session.overallScore ? session.overallScore.toFixed(1) : '-'}
          </p>
          <p className="text-xs text-muted-foreground">score</p>
        </div>
      </div>
    </Link>
  );
}
