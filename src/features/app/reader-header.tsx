'use client';

/**
 * Header for the public reader layout (/resources/*).
 * Renders different right-side controls depending on auth state:
 *   - Guest   → Sign in + Get started buttons
 *   - Auth'd  → App breadcrumb + user avatar + theme/signout
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Library, LayoutDashboard, ChevronRight, Moon, Sun, LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/common/brand-logo';
import { buttonVariants } from '@/components/ui/button';
import { signOut } from '@/features/auth/sign-out-action';

interface AuthUser {
  name: string | null;
  email: string;
  image?: string | null;
}

interface Props {
  user: AuthUser | null;
}

export function ReaderHeader({ user }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  const isDark = resolvedTheme === 'dark';
  const isResourcesIndex = pathname === '/resources';

  // Label + href for the specific handbook/glossary sub-page (null on the index)
  const handbookLabel =
    pathname.startsWith('/resources/glossary')          ? 'Glossary'
    : pathname.startsWith('/resources/frontend-system-design') ? 'System Design'
    : pathname.startsWith('/resources/javascript-core') ? 'JavaScript Core'
    : pathname.startsWith('/resources/react-deep-dive') ? 'React Deep Dive'
    : pathname.startsWith('/resources/optimization-deep-dive') ? 'Optimization'
    : null;

  const handbookHref =
    pathname.startsWith('/resources/glossary')          ? '/resources/glossary'
    : pathname.startsWith('/resources/frontend-system-design') ? '/resources/frontend-system-design'
    : pathname.startsWith('/resources/javascript-core') ? '/resources/javascript-core'
    : pathname.startsWith('/resources/react-deep-dive') ? '/resources/react-deep-dive'
    : pathname.startsWith('/resources/optimization-deep-dive') ? '/resources/optimization-deep-dive'
    : '/resources';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-5 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 print:hidden">
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-1">
        {user ? (
          // Auth'd: App > Handbook
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground"
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">App</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
          </>
        ) : (
          // Guest: brand name links home
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground"
          >
            <BrandLogo className="size-5" />
            <span className="hidden sm:inline font-semibold">Frontend Coach</span>
          </Link>
        )}
        {/* Resources crumb — active when on the index, otherwise a link */}
        <Link
          href="/resources"
          className={
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ' +
            (isResourcesIndex
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground')
          }
        >
          <Library className="h-3.5 w-3.5 shrink-0" />
          Resources
        </Link>

        {/* Handbook crumb — only on a specific handbook/glossary page */}
        {handbookLabel && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            <Link
              href={handbookHref}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-primary/12 text-primary"
            >
              {handbookLabel}
            </Link>
          </>
        )}
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2">
        {user ? (
          // Auth'd: user info + theme + signout
          <>
            <div className="hidden min-w-0 text-right sm:block mr-1">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {user.name ?? user.email}
              </p>
              {user.name && (
                <p className="truncate text-xs text-muted-foreground leading-tight">{user.email}</p>
              )}
            </div>
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? user.email}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-brand-indigo text-xs font-bold text-primary-foreground">
                {(user.name ?? user.email).slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="mx-1 h-5 w-px bg-border/80" />
            <button
              type="button"
              onClick={() => mounted && setTheme(isDark ? 'light' : 'dark')}
              aria-label="Toggle color theme"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {mounted && isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </>
        ) : (
          // Guest: theme toggle + sign-in + CTA
          <>
            <button
              type="button"
              onClick={() => mounted && setTheme(isDark ? 'light' : 'dark')}
              aria-label="Toggle color theme"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {mounted && isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <span className="mx-1 h-5 w-px bg-border/60" />
            <Link
              href="/sign-in"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-in?next=/onboarding"
              className={buttonVariants({ size: 'sm' }) + ' text-xs'}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
