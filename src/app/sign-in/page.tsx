import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BrandLogo } from '@/components/common/brand-logo';
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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          ← Home
        </Link>
        <BrandLogo className="mx-auto mt-6 size-12" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary">Frontend Coach</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to track your scores, streaks, and study plan.
        </p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card/80 p-8 backdrop-blur-sm">
        <Suspense fallback={<div className="h-40" />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
