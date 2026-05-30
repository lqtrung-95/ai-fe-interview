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
    <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      {/* Logo */}
      <div className="px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-indigo shadow-md shadow-primary/30">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            Frontend Coach
          </span>
        </Link>
      </div>

      {/* Nav label */}
      <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
        Menu
      </p>

      {/* Nav items */}
      <nav className="flex-1 px-2 pb-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href} className="relative">
                {/* Active left-edge bar */}
                {active && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
                )}
                <Link
                  href={item.href}
                  className={
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ' +
                    (active
                      ? 'bg-primary/15 text-primary'
                      : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground')
                  }
                >
                  <Icon
                    className={
                      'h-4 w-4 shrink-0 transition-colors ' +
                      (active ? 'text-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80')
                    }
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom gradient accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="px-4 py-3">
        <p className="text-[10px] text-sidebar-foreground/25">Frontend Coach v1.0</p>
      </div>
    </aside>
  );
}
