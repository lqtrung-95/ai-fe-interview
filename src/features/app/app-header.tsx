'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Crown, Library, LogOut, Menu, Moon, Sun, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { BrandLogo } from '@/components/common/brand-logo';
import { SignOutButton } from '@/features/auth/sign-out-button';
import { APP_NAV, formatAppDate, isAppNavActive } from './app-nav';
import { NavLinkPendingIndicator } from './nav-link-pending-indicator';

interface Props {
  isPro?: boolean;
  proExpiresAt?: string | null;
  proSince?: string | null;
  userName: string | null;
  userEmail: string;
  userImage?: string | null;
}

export function AppHeader({
  isPro = false,
  proExpiresAt = null,
  proSince = null,
  userName,
  userEmail,
  userImage,
}: Props) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === 'dark';
  const displayName = userName ?? userEmail;

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Close the account dropdown on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAccountOpen(false);
    }
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [accountOpen]);

  return (
    <header className="app-header fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 md:left-56">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 md:hidden">
          <BrandLogo className="size-7 shrink-0" />
          <span className="truncate text-sm font-bold tracking-tight text-foreground">
            Frontend Coach
          </span>
        </Link>

        {/* Left — Resources entry (links to the index, user picks handbook or glossary from there) */}
        <Link
          href="/resources"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground md:flex"
        >
          <Library className="h-3.5 w-3.5 shrink-0" />
          Resources
        </Link>
      </div>

      {/* Right — single account menu (declutters name/email/theme/sign-out into one avatar dropdown) */}
      <div ref={accountRef} className="relative hidden md:block">
        <button
          type="button"
          onClick={() => setAccountOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-label="Account menu"
          className="flex cursor-pointer items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-muted/60"
        >
          {userImage ? (
            <img src={userImage} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-brand-indigo text-xs font-bold text-primary-foreground">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-[10rem] truncate text-sm font-medium text-foreground lg:block">
            {userName ?? userEmail}
          </span>
          <ChevronDown
            className={'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ' + (accountOpen ? 'rotate-180' : '')}
          />
        </button>

        {accountOpen && (
          <div
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/10 dark:shadow-black/30"
          >
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              {userName && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
            </div>
            <div className="my-1 h-px bg-border/60" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setTheme(isDark ? 'light' : 'dark');
                setAccountOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted/60"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
            <SignOutButton
              ariaLabel="Sign out"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </SignOutButton>
          </div>
        )}
      </div>

      <button
        type="button"
        aria-controls="mobile-app-menu"
        aria-expanded={menuOpen}
        aria-label="Open navigation menu"
        onClick={() => setMenuOpen(true)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary md:hidden"
      >
        <Menu className="h-3.5 w-3.5" />
      </button>

      {menuOpen ? (
        <div className="fixed inset-0 top-14 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 cursor-default bg-background/45 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-app-menu"
            role="dialog"
            aria-modal="true"
            aria-label="App navigation"
            className="app-sidebar absolute inset-x-3 top-3 flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar/98 shadow-[0_18px_55px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-start justify-between gap-3 px-3 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">Signed in</p>
                <p className="mt-0.5 truncate text-sm font-bold tracking-tight text-sidebar-foreground">{displayName}</p>
                {userName ? (
                  <p className="mt-0.5 truncate text-xs text-sidebar-foreground/45">{userEmail}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/45 text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
              <ul className="space-y-0.5">
                <li className="relative">
                  <Link
                    href="/resources"
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-all duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  >
                    <Library className="h-4 w-4 shrink-0 text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80" />
                    Resources
                  </Link>
                </li>
                {APP_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isAppNavActive(pathname, item.href);
                  return (
                    <li key={item.href} className="relative">
                      {active ? (
                        <span className="app-nav-indicator absolute -left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" />
                      ) : null}
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ' +
                          (active
                            ? 'app-nav-active text-primary'
                            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground')
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

            <div className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="grid shrink-0 grid-cols-2 gap-2 px-3 pt-3">
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/35 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
              >
                <Sun className="hidden h-3.5 w-3.5 dark:block" />
                <Moon className="h-3.5 w-3.5 dark:hidden" />
                Theme
              </button>
              <SignOutButton className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/35 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </SignOutButton>
            </div>
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
                  onClick={() => setMenuOpen(false)}
                  className="app-upgrade-card flex items-center gap-2 rounded-lg border border-primary/25 px-3 py-2 text-xs font-medium text-primary transition-all"
                >
                  <Zap className="h-3 w-3 shrink-0" />
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
