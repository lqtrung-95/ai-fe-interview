'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Clock, Database, LayoutDashboard, LogOut, Settings, Zap } from 'lucide-react';
import { signOut } from '@/features/auth/sign-out-action';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice/new', label: 'Practice', icon: Zap },
  { href: '/study-plan', label: 'Study Plan', icon: BookOpen },
  { href: '/question-bank', label: 'Question Bank', icon: Database },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ userName, userEmail }: { userName: string | null; userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border/70 bg-sidebar/95 md:flex">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shadow-sm">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">Interview Coach</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3">
        <ul className="space-y-1">
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
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground')
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

      <div className="border-t border-border/70 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {(userName ?? userEmail).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">{userName ?? userEmail}</p>
            <p className="truncate text-xs text-muted-foreground">{userName ? userEmail : ''}</p>
          </div>
        </div>
        <ThemeToggleButton />
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
