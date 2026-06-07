/**
 * Shared chart tokens for the dashboard. These reference the same CSS variables
 * used by the app and marketing surfaces so charts follow light/dark brand theming.
 */

export const CHART = {
  primary: 'var(--primary)',
  primarySoft: 'color-mix(in oklab, var(--primary) 18%, transparent)',
  axis: 'var(--muted-foreground)',
  grid: 'color-mix(in oklab, var(--border) 72%, transparent)',
  topic: [
    'var(--brand-indigo)',
    'var(--brand-pink)',
    'var(--brand-teal)',
    'var(--primary)',
    'color-mix(in oklab, var(--brand-indigo) 70%, var(--brand-pink))',
    'color-mix(in oklab, var(--brand-teal) 70%, var(--brand-indigo))',
    'color-mix(in oklab, var(--brand-pink) 70%, var(--brand-teal))',
  ],
} as const;

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatShortDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
