'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Thin wrapper around next-themes ThemeProvider.
 * Placed here so the root layout (a server component) can import it
 * without pulling 'use client' into the layout itself.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
