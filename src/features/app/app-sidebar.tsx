import Link from 'next/link';
import { signOut } from '@/features/auth/sign-out-action';
import { buttonVariants } from '@/components/ui/button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/practice/new', label: 'Practice' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
];

export function AppSidebar({ userName, userEmail }: { userName: string | null; userEmail: string }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex">
      <div className="border-b border-border/60 px-4 py-4">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          AI Interview Coach
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-border/60 px-4 py-3">
        <p className="truncate text-xs text-muted-foreground">{userName ?? userEmail}</p>
        <form action={signOut} className="mt-2">
          <button type="submit" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' w-full justify-start'}>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
