import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/features/auth/sign-in-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  // Next.js 16: searchParams is async.
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;

  if (user) {
    redirect(next ?? '/dashboard');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save your progress, track scores, and pick up where you left off.
        </p>
      </div>
      <Suspense fallback={<div className="h-40" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
