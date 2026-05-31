import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { CvReviewPanel } from '@/features/cv-review/cv-review-panel';

export const metadata: Metadata = {
  title: 'CV Review',
  description: 'AI-powered feedback on your CV — ATS score, keyword gaps, and frontend-specific suggestions.',
};

export default async function CvReviewPage() {
  const user = await requireUser();

  // Guard: redirect to settings with a hint if no CV is uploaded yet
  if (!user.cvData) {
    redirect('/settings?hint=upload-cv');
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">CV Review</h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          AI-powered feedback on your résumé — ATS compatibility, missing keywords,
          impact statement quality, and frontend-specific improvements.
        </p>
      </header>

      <CvReviewPanel hasCv={!!user.cvData} />
    </div>
  );
}
