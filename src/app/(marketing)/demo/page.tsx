import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { FeedbackCard } from '@/features/feedback/components/feedback-card';
import { DEMO_TURN } from '@/features/demo/demo-session-data';

export const metadata = {
  title: 'Demo',
  description: 'Walk through one realistic AI interview turn — question, answer, feedback.',
};

export default function DemoPage() {
  const turn = DEMO_TURN;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Demo · no sign-in</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          One question. One answer. Full feedback.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This is a static walkthrough of one realistic turn — same components as a live session.
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {turn.topic} · {turn.difficulty}
          </Badge>
          <Badge variant="secondary">{turn.type.replace('_', ' ')}</Badge>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Question</p>
          <p className="mt-2 text-lg font-medium leading-relaxed">{turn.question}</p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Your answer</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {turn.userAnswer}
          </p>
        </div>

        <FeedbackCard feedback={turn.feedback} />

        <div className="rounded-lg border border-dashed border-border/60 bg-card/50 px-6 py-8 text-center">
          <p className="text-sm font-medium">Want feedback on your own answers?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in and run a real session — your topics, your level, your pace.
          </p>
          <div className="mt-4">
            <Link href="/sign-in?next=/onboarding" className={buttonVariants()}>
              Start practicing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
