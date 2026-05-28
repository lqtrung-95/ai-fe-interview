import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

const SCORE = 3.2;
const MAX = 5;
const PCT = (SCORE / MAX) * 100;

export function LandingFeedbackPreview() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">An example of structured feedback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every answer is scored across six dimensions and paired with a senior-level rewrite.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">React</Badge>
            <Badge variant="secondary">Senior</Badge>
          </div>
          <p className="mt-3 text-sm font-medium">
            Q: How would you investigate and optimize a slow React page?
          </p>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score</span>
            <span className="text-sm font-bold text-foreground">{SCORE} / {MAX}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${PCT}%` }}
            />
          </div>

          <ul className="mt-4 space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span className="text-foreground/80">Correctly identified the need to measure before optimizing</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span className="text-muted-foreground">Missed bundle-size analysis and rendering-vs-network distinction</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span className="text-muted-foreground">No mention of performance budgets or regression prevention</span>
            </li>
          </ul>
        </div>

        <div className="border-t border-border/60 bg-primary/5 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Senior-level addition</p>
          <p className="mt-2 text-sm text-foreground/80">
            Tie technical optimization back to product impact — define the user journey affected, prioritize by
            measurable user benefit, and add monitoring so wins do not silently regress.
          </p>
        </div>
      </div>
    </section>
  );
}
