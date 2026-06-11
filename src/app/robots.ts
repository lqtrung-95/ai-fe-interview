import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site-url';

/**
 * /robots.txt — public pages crawlable; API and signed-in app surfaces are
 * not useful to crawlers (auth-gated, render redirects) so they're excluded.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/dashboard',
        '/practice',
        '/question-bank',
        '/coding-challenges',
        '/cv-review',
        '/history',
        '/onboarding',
        '/settings',
        '/study-plan',
        '/upgrade',
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
