'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

/**
 * Global error boundary. Catches unhandled errors in any route segment
 * that doesn't have a more specific error.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Unexpected error</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Something went wrong.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || 'An unexpected issue occurred.'}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
