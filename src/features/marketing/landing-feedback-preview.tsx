import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LandingFeedbackPreview() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">An example of structured feedback</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every answer is scored across six dimensions and paired with a senior-level rewrite.
        </p>
      </div>
      <Card className="mt-8 p-6">
        <div className="flex items-start gap-2">
          <Badge variant="outline">React · Senior</Badge>
        </div>
        <p className="mt-4 text-sm font-medium">
          Q: How would you investigate and optimize a slow React page?
        </p>
        <div className="mt-4 rounded-md border border-border/60 bg-muted/40 p-3 text-sm">
          <p className="font-medium">Score · 3.2 / 5</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>+ Correctly identified the need to measure before optimizing</li>
            <li>− Missed bundle-size analysis and rendering-vs-network distinction</li>
            <li>− No mention of performance budgets or regression prevention</li>
          </ul>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">Senior-level addition</p>
        <p className="mt-1 text-sm text-foreground/80">
          Tie technical optimization back to product impact — define the user journey affected, prioritize by
          measurable user benefit, and add monitoring so wins do not silently regress.
        </p>
      </Card>
    </section>
  );
}
