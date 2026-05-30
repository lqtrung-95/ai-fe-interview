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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end border-b border-border/70 bg-background/85 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-3">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{userName ? userEmail : ''}</p>
        </div>

        {/* Avatar: photo when set, otherwise initials */}
        {userImage ? (
          <img
            src={userImage}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-border/50"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        )}

        <button
          type="button"
          onClick={() => mounted && setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border/70 bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
