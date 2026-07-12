import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicSessionByToken } from '@/features/feedback/server/share-service';
import { getSiteUrl } from '@/lib/seo/site-url';

interface PageProps {
  params: Promise<{ token: string }>;
}

function scoreGrade(score: number) {
  if (score >= 4.5) return { label: 'Excellent', color: 'text-emerald-500', bg: 'border-emerald-500/20 bg-emerald-500/5' };
  if (score >= 3.5) return { label: 'Strong', color: 'text-primary', bg: 'border-primary/20 bg-primary/5' };
  if (score >= 2.5) return { label: 'Developing', color: 'text-amber-500', bg: 'border-amber-500/20 bg-amber-500/5' };
  return { label: 'Needs work', color: 'text-rose-500', bg: 'border-rose-500/20 bg-rose-500/5' };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getPublicSessionByToken(token);
  if (!data) return { title: 'Session result' };

  const grade = scoreGrade(data.overallScore);
  const siteUrl = getSiteUrl();
  const title = `${data.overallScore.toFixed(1)}/5 · ${grade.label} — Frontend Coach`;
  const description = data.strongAreas.length
    ? `Strong in: ${data.strongAreas.slice(0, 3).join(', ')}. Powered by Frontend Coach AI interview practice.`
    : 'Frontend Coach AI interview session result.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/share/${token}`,
      type: 'website',
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getPublicSessionByToken(token);
  if (!data) notFound();

  const grade = scoreGrade(data.overallScore);
  const siteUrl = getSiteUrl();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border/50 px-6 py-4">
        <Link href={siteUrl} className="text-sm font-bold text-foreground hover:text-primary transition-colors">
          Frontend Coach
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Interview result
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Session summary</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared from a Frontend Coach AI practice session.
          </p>
        </div>

        {/* Score hero */}
        <div className={`rounded-xl border p-6 ${grade.bg}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Overall score
          </p>
          <div className="mt-3 flex items-end gap-3">
            <span className={`text-6xl font-extrabold tabular-nums tracking-tight ${grade.color}`}>
              {data.overallScore.toFixed(1)}
            </span>
            <span className="mb-2 text-xl text-muted-foreground font-medium">/ 5</span>
            <span className={`mb-2 rounded-md px-2.5 py-1 text-sm font-bold ${grade.color} bg-current/10`}>
              {grade.label}
            </span>
          </div>
          {data.session.topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {data.session.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Strong + Weak areas */}
        <div className="grid gap-4 sm:grid-cols-2">
          <AreaCard title="Strong areas" items={data.strongAreas} dot="bg-emerald-500" header="text-emerald-600 dark:text-emerald-400" />
          <AreaCard title="Weak areas" items={data.weakAreas} dot="bg-rose-500" header="text-rose-600 dark:text-rose-400" />
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center">
          <p className="text-sm font-semibold">Want to benchmark your own skills?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Frontend Coach gives you AI-led practice interviews with rubric-grounded feedback and scoring.
          </p>
          <Link
            href={siteUrl}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try Frontend Coach →
          </Link>
        </div>
      </main>
    </div>
  );
}

function AreaCard({
  title,
  items,
  dot,
  header,
}: {
  title: string;
  items: string[];
  dot: string;
  header: string;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className={`text-sm font-bold ${header}`}>{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">None noted.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
