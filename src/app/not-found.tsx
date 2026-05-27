import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Page not found.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That route doesn’t exist — or you don’t have access to it.
      </p>
      <div className="mt-8">
        <Link href="/" className={buttonVariants()}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
