import type { MetadataRoute } from 'next';
import { listIndexableQuestionSlugs } from '@/features/study/server/study-public-service';
import { getSiteUrl } from '@/lib/seo/site-url';

/**
 * /sitemap.xml — static marketing/reader routes plus every indexable
 * question page. Question slugs come from a 1h-cached read (no per-request
 * DB scan); thin questions (no ELI5 yet) are excluded by the service.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/demo`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/resources`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/resources/frontend-system-design`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resources/frontend-system-design/cheatsheet`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/resources/javascript-core`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resources/javascript-core/cheatsheet`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/resources/react-deep-dive`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resources/react-deep-dive/cheatsheet`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/resources/optimization-deep-dive`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resources/optimization-deep-dive/cheatsheet`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/resources/glossary`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/questions`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  // This runs at build time (the route has no dynamic API usage) — a DB blip
  // must degrade to a static-only sitemap rather than fail the deploy.
  let slugs: string[] = [];
  try {
    slugs = await listIndexableQuestionSlugs();
  } catch (err) {
    console.error('sitemap: question slug lookup failed, emitting static routes only', err);
  }
  const questionRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/questions/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...questionRoutes];
}
