/**
 * Single source of truth for the site's absolute base URL.
 * Used by canonical tags, sitemap.xml, robots.txt, and OG image URLs so they
 * never disagree — and never leak a preview-deployment host into canonicals.
 *
 * Reuses NEXT_PUBLIC_APP_URL — the established canonical-origin env var
 * (also consumed by checkout success URLs and session share links).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  // Stable production domain on Vercel (preview deploys also resolve this,
  // keeping canonicals pointed at production rather than the preview host).
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  return 'http://localhost:3000';
}
