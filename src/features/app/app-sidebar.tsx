'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Clock, Settings, LogOut, Layers } from 'lucide-react';
import { signOut } from '@/features/auth/sign-out-action';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice/new', label: 'Practice', icon: Zap },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ userName, userEmail }: { userName: string | null; userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex">
      <div className="border-b border-border/60 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-semibold tracking-tight text-sidebar-foreground">Interview Coach</span>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ' +
                    (active
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground')
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border/60 px-3 py-3">
        <div className="mb-2 px-1">
          <p className="truncate text-xs font-medium text-sidebar-foreground">{userName ?? userEmail}</p>
          <p className="truncate text-xs text-muted-foreground">{userName ? userEmail : ''}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
