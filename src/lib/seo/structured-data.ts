/**
 * Pure builders for schema.org JSON-LD objects. No React — callers pass the
 * result to <JsonLd />. Kept separate from rendering so the shapes are unit-
 * testable and reusable across pages.
 *
 * Schema choices:
 *   - Question pages → QAPage (one question + accepted answer). FAQPage rich
 *     results were restricted to gov/health sites in 2023; QAPage rich results
 *     are still active for single-question pages.
 *   - BreadcrumbList on question + topic pages → breadcrumb trail in results.
 *   - Organization + WebSite on the homepage → brand entity for name searches.
 */
import { getSiteUrl } from './site-url';
import { getTopicPageByTopic } from './question-topic-slugs';

type JsonLdObject = Record<string, unknown>;

interface Crumb {
  name: string;
  url: string;
}

/** QAPage schema for one interview-question page (question + accepted answer). */
export function buildQuestionQaPageJsonLd(params: {
  question: string;
  answerText: string;
  url: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: params.question,
      text: params.question,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: params.answerText,
        url: params.url,
      },
    },
  };
}

/** BreadcrumbList from an ordered list of crumbs. */
export function buildBreadcrumbJsonLd(crumbs: Crumb[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

/** Breadcrumb trail for a question detail page: Home → Questions → Topic → Question. */
export function buildQuestionBreadcrumbs(params: {
  topic: string;
  questionTitle: string;
  questionUrl: string;
}): JsonLdObject {
  const base = getSiteUrl();
  const crumbs: Crumb[] = [
    { name: 'Home', url: `${base}/` },
    { name: 'Interview Questions', url: `${base}/questions` },
  ];
  const topicPage = getTopicPageByTopic(params.topic);
  if (topicPage) {
    crumbs.push({ name: topicPage.title, url: `${base}/questions/${topicPage.slug}` });
  }
  crumbs.push({ name: params.questionTitle, url: params.questionUrl });
  return buildBreadcrumbJsonLd(crumbs);
}

/** Breadcrumb trail for a topic hub page: Home → Questions → Topic. */
export function buildTopicHubBreadcrumbs(params: {
  topicTitle: string;
  topicSlug: string;
}): JsonLdObject {
  const base = getSiteUrl();
  return buildBreadcrumbJsonLd([
    { name: 'Home', url: `${base}/` },
    { name: 'Interview Questions', url: `${base}/questions` },
    { name: params.topicTitle, url: `${base}/questions/${params.topicSlug}` },
  ]);
}

/** Organization + WebSite entity for the homepage — brand-name search, knowledge panel. */
export function buildSiteIdentityJsonLd(): JsonLdObject[] {
  const base = getSiteUrl();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Frontend Coach',
      url: base,
      logo: `${base}/brand/frontend-coach-logo-v3.png`,
      description:
        'AI-led frontend interview practice with rubric-grounded feedback, scoring, and a personalised study plan.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Frontend Coach',
      url: base,
    },
  ];
}
