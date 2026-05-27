import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
      <div className="mt-8">
        <Link href="/onboarding" className={buttonVariants({ variant: 'outline' })}>
          Edit preferences
        </Link>
      </div>
    </div>
  );
}
