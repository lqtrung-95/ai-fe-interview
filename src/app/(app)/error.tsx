'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

/**
 * App-shell error boundary. Catches errors inside the auth-gated layout so
 * the sidebar stays mounted while the affected route shows a recovery UI.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Something broke</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">We couldn’t load this page.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || 'An unexpected error happened. Your data is safe.'}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
