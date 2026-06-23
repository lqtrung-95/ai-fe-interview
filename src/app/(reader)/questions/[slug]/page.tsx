import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getStudyQuestionBySlug,
  listPublicQuestionSummaries,
} from '@/features/study/server/study-public-service';
import { PublicQuestionDetail } from '@/features/study/components/public/public-question-detail';
import { PublicTopicHub } from '@/features/study/components/public/public-topic-hub';
import { getSiteUrl } from '@/lib/seo/site-url';
import { getTopicPageBySlug } from '@/lib/seo/question-topic-slugs';
import { JsonLd } from '@/components/seo/json-ld';
import {
  buildQuestionQaPageJsonLd,
  buildQuestionBreadcrumbs,
  buildTopicHubBreadcrumbs,
} from '@/lib/seo/structured-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RELATED_COUNT = 6;

/** Truncate at a word boundary, appending an ellipsis when cut. */
function excerpt(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Topic hub pages share this segment — reserved slugs, zero overlap with
  // question slugs (which derive from question text).
  const topicPage = getTopicPageBySlug(slug);
  if (topicPage) {
    const canonical = `${getSiteUrl()}/questions/${topicPage.slug}`;
    const description = topicPage.intro.length > 155
      ? `${topicPage.intro.slice(0, 152).trimEnd()}…`
      : topicPage.intro;
    return {
      title: topicPage.title,
      description,
      alternates: { canonical },
      openGraph: { title: topicPage.title, description, url: canonical, type: 'website' },
      twitter: { card: 'summary', title: topicPage.title, description },
    };
  }

  const q = await getStudyQuestionBySlug(slug);
  // Renders the not-found page. Note: on this force-dynamic route the response
  // streams with status 200 + a noindex meta tag (Next streaming-metadata
  // behavior) — crawlers won't index it, but it's not a hard 404 status.
  if (!q) notFound();

  const title = excerpt(q.question, 60);
  const description = q.childExplanation
    ? excerpt(q.childExplanation, 155)
    : `${q.topic} interview question with explanation: ${excerpt(q.question, 110)}`;
  const canonical = `${getSiteUrl()}/questions/${q.slug}`;
  const ogImage = `${getSiteUrl()}/api/og/question?slug=${encodeURIComponent(q.slug)}`;

  return {
    title,
    description,
    // Questions still missing an ELI5 render thin pages — keep them out of
    // the index (they're also excluded from the sitemap) but let crawlers
    // follow their links. The content sprint removes the gap over time.
    robots: q.childExplanation ? undefined : { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// Same rationale as the in-app question-bank detail page: the reader layout
// reads auth cookies, so render fully dynamic instead of streaming.
export const dynamic = 'force-dynamic';

export default async function PublicQuestionDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const topicPage = getTopicPageBySlug(slug);
  if (topicPage) {
    const questions = (await listPublicQuestionSummaries()).filter(
      (q) => q.topic === topicPage.topic,
    );
    const breadcrumbs = buildTopicHubBreadcrumbs({
      topicTitle: topicPage.title,
      topicSlug: topicPage.slug,
    });
    return (
      <>
        <JsonLd data={breadcrumbs} />
        <PublicTopicHub page={topicPage} questions={questions} />
      </>
    );
  }

  const [q, user] = await Promise.all([getStudyQuestionBySlug(slug), getCurrentUser()]);
  if (!q) notFound();

  // Same-topic internal-link mesh (excluding the current question).
  const related = (await listPublicQuestionSummaries())
    .filter((r) => r.topic === q.topic && r.slug !== q.slug)
    .slice(0, RELATED_COUNT);

  // Structured data: QAPage (only on indexable pages — those with an ELI5
  // answer) plus a breadcrumb trail. The noindex thin pages skip the QAPage so
  // we never advertise a rich result for a page we ask Google not to index.
  const questionUrl = `${getSiteUrl()}/questions/${q.slug}`;
  const structuredData: Record<string, unknown>[] = [
    buildQuestionBreadcrumbs({
      topic: q.topic,
      questionTitle: excerpt(q.question, 60),
      questionUrl,
    }),
  ];
  if (q.childExplanation) {
    structuredData.unshift(
      buildQuestionQaPageJsonLd({
        question: q.question,
        answerText: q.childExplanation,
        url: questionUrl,
      }),
    );
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <PublicQuestionDetail q={q} related={related} isSignedIn={!!user} />
    </>
  );
}
