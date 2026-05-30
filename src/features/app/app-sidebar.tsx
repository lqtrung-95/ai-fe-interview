'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Clock, Database, LayoutDashboard, Settings, Zap } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice/new', label: 'Practice', icon: Zap },
  { href: '/study-plan', label: 'Study Plan', icon: BookOpen },
  { href: '/question-bank', label: 'Question Bank', icon: Database },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
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
    </aside>
  );
}
