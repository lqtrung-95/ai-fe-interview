import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Welcome to Pro!' };

export default function UpgradeSuccessPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 mb-5">
        <CheckCircle className="h-7 w-7 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">You're on Pro!</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your account has been upgraded. Unlimited sessions, full history, and the complete study
        system are now unlocked.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        It may take a few seconds for your account to reflect the change.
      </p>
      <Link href="/practice/new" className={buttonVariants({ className: 'mt-8 w-full' })}>
        Start practicing
      </Link>
      <Link
        href="/dashboard"
        className={buttonVariants({ variant: 'ghost', className: 'mt-2 w-full' })}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
