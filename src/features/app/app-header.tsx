'use client';

import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { signOut } from '@/features/auth/sign-out-action';

interface Props {
  userName: string | null;
  userEmail: string;
  userImage?: string | null;
}

export function AppHeader({ userName, userEmail, userImage }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const displayName = userName ?? userEmail;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end border-b border-border/60 bg-background/90 px-5 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="flex items-center gap-2">
        {/* Name + email */}
        <div className="hidden min-w-0 text-right sm:block mr-1">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">{displayName}</p>
          {userName && (
            <p className="truncate text-xs text-muted-foreground leading-tight">{userEmail}</p>
          )}
        </div>

        {/* Avatar */}
        {userImage ? (
          <img
            src={userImage}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-brand-indigo text-xs font-bold text-primary-foreground">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        )}

        {/* Divider */}
        <span className="mx-1 h-5 w-px bg-border/80" />

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => mounted && setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle color theme"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          {mounted && isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
