import Link from 'next/link';
import { BriefcaseBusiness, Building2, Gauge, Pencil, SlidersHorizontal } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  companyType: string | null;
  level: string | null;
  role: string | null;
  topics: string[];
}

export function InterviewPreferencesCard({ companyType, level, role, topics }: Props) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold">Interview preferences</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your question difficulty and topic mix are tailored to these goals.
            </p>
          </div>
        </div>
        <Link href="/onboarding" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>

      {role ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <PreferenceTile icon={Gauge} label="Interview level" value={level ?? 'Not set'} capitalize />
            <PreferenceTile icon={BriefcaseBusiness} label="Target role" value={role} />
            <PreferenceTile icon={Building2} label="Company type" value={companyType ?? 'Not set'} />
          </div>

          {topics.length > 0 && (
            <div className="mt-6 border-t border-border/70 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Practice focus areas</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Included when generating your mock interviews.</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {topics.length} selected
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground/85"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No preferences set yet.{' '}
          <Link href="/onboarding" className="font-medium text-primary underline-offset-2 hover:underline">
            Complete setup
          </Link>
        </p>
      )}
    </section>
  );
}

function PreferenceTile({
  capitalize,
  icon: Icon,
  label,
  value,
}: {
  capitalize?: boolean;
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}
