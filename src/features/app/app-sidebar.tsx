'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crown, Zap } from 'lucide-react';
import { BrandLogo } from '@/components/common/brand-logo';
import { APP_NAV, formatAppDate, isAppNavActive } from './app-nav';
import { NavLinkPendingIndicator } from './nav-link-pending-indicator';

interface Props {
  isPro?: boolean;
  proExpiresAt?: string | null;
  proSince?: string | null;
}

export function AppSidebar({ isPro = false, proExpiresAt = null, proSince = null }: Props) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden h-dvh w-56 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl md:flex">
      {/* Logo */}
      <div className="px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <BrandLogo />
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
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {APP_NAV.map((item) => {
            const Icon = item.icon;
            const active = isAppNavActive(pathname, item.href);
            return (
              <li key={item.href} className="relative">
                {/* Active left-edge bar */}
                {active && (
                  <span className="app-nav-indicator absolute -left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" />
                )}
                <Link
                  href={item.href}
                  className={
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ' +
                    (active
                      ? 'app-nav-active text-primary'
                      : 'text-sidebar-foreground/55 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground')
                  }
                >
                  <Icon
                    className={
                      'h-4 w-4 shrink-0 transition-colors ' +
                      (active ? 'text-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80')
                    }
                  />
                  {item.label}
                  <NavLinkPendingIndicator />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom gradient accent line */}
      <div className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Pro badge or upgrade CTA */}
      <div className="shrink-0 px-3 py-3">
        {isPro ? (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/35 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/12 text-amber-500">
                <Crown className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-sidebar-foreground">Pro</p>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-label="Active" />
                </div>
                <p className="mt-0.5 truncate text-[10px] text-sidebar-foreground/45">
                  {proExpiresAt
                    ? `Expires ${formatAppDate(proExpiresAt)}`
                    : proSince
                      ? `Since ${formatAppDate(proSince)}`
                      : 'Active plan'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/upgrade"
            className="app-upgrade-card flex items-center gap-2 rounded-lg border border-primary/25 px-3 py-2 text-xs font-medium text-primary transition-all"
          >
            <Zap className="h-3 w-3 shrink-0" />
            Upgrade to Pro
          </Link>
        )}
      </div>

      <div className="shrink-0 px-4 py-3">
        <p className="text-[10px] text-sidebar-foreground/25">Frontend Coach v1.0</p>
      </div>
    </aside>
  );
}
