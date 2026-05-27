/**
 * Shared chart tokens for the dashboard. Stays consistent with shadcn slate theme
 * via CSS vars; chart-specific colors fall back to neutral muted tones so charts
 * never clash with the calm palette (PRD §12.1).
 */

export const CHART = {
  primary: 'hsl(220 90% 56%)',
  primarySoft: 'hsl(220 90% 56% / 0.18)',
  axis: 'hsl(220 5% 60%)',
  grid: 'hsl(220 5% 80% / 0.4)',
  topic: ['#2563eb', '#7c3aed', '#16a34a', '#ea580c', '#dc2626', '#0891b2', '#a21caf'],
} as const;

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatShortDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
