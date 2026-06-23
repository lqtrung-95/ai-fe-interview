'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Briefcase, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TargetJobAddForm } from './target-job-add-form';

const MAX_JOBS = 3;

interface SavedJob {
  id: string;
  label: string;
}

interface Props {
  isPro: boolean;
  initialJobs: SavedJob[];
}

export function TargetJobsCard({ isPro, initialJobs }: Props) {
  const [jobs, setJobs] = useState<SavedJob[]>(initialJobs);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedJob | null>(null);
  const [, startTransition] = useTransition();

  function handleSaved(job: SavedJob) {
    setJobs((prev) => [job, ...prev]);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const res = await fetch(`/api/target-jobs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
      }
      setDeletingId(null);
    });
  }

  return (
    <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">Job targets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save up to {MAX_JOBS} job descriptions. Questions will be tailored to that specific role and company.
          </p>
        </div>
        {isPro && !showForm && jobs.length < MAX_JOBS && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="shrink-0">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        )}
      </div>

      {!isPro ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold">Pro feature</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste a JD and every question will be tailored to that role and company.
            </p>
          </div>
          <Link href="/upgrade" className={buttonVariants({ size: 'sm' })}>
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <>
          {jobs.length > 0 && (
            <ul className="space-y-2">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3"
                >
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm font-medium">{job.label}</span>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(job)}
                    disabled={deletingId === job.id}
                    aria-label={`Remove ${job.label}`}
                    className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {jobs.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground">No job targets saved yet.</p>
          )}

          {jobs.length >= MAX_JOBS && (
            <p className="text-xs text-muted-foreground">Remove one to add another.</p>
          )}

          {showForm && (
            <TargetJobAddForm
              onSaved={handleSaved}
              onCancel={() => setShowForm(false)}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this job target?"
        description={
          pendingDelete
            ? `"${pendingDelete.label}" will be removed. Sessions already tailored to it are unaffected.`
            : ''
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
