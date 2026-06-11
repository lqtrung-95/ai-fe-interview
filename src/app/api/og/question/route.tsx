import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

const DIFFICULTY_COLORS: Record<string, string> = {
  junior: '#22c55e',
  mid: '#3b82f6',
  senior: '#a855f7',
};

/** Plain-text truncation — ImageResponse escapes content, this just caps length. */
function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * GET /api/og/question?slug=<slug>
 * 1200×630 OG share image for a public question page.
 * Public by design — queries display fields only (never rubric/expectedPoints).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return new Response('Missing slug', { status: 400 });
  if (slug.length > 120) return new Response('Invalid slug', { status: 400 });

  let q;
  try {
    q = await prisma.seedQuestion.findUnique({
      where: { slug },
      select: { topic: true, difficulty: true, question: true },
    });
  } catch {
    return new Response('Image generation failed', { status: 500 });
  }
  if (!q) return new Response('Not found', { status: 404 });

  const difficultyColor = DIFFICULTY_COLORS[q.difficulty] ?? '#94a3b8';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #0f0f18 0%, #13131f 100%)',
          padding: '72px 80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, color: '#7c6af7' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c6af7' }} />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '0.08em', color: '#7c6af7' }}>
            FRONTEND COACH
          </span>
        </div>

        {/* Topic + difficulty chips */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              padding: '6px 18px',
              borderRadius: 999,
              background: '#1e1e30',
              border: '1px solid #2d2d4a',
              color: '#e2e8f0',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {clip(q.topic, 40)}
          </div>
          <div
            style={{
              display: 'flex',
              padding: '6px 18px',
              borderRadius: 999,
              background: '#1e1e30',
              border: `1px solid ${difficultyColor}`,
              color: difficultyColor,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
          </div>
        </div>

        {/* Question */}
        <p style={{ fontSize: 44, color: '#f1f5f9', fontWeight: 700, lineHeight: 1.25, margin: 0 }}>
          {clip(q.question, 140)}
        </p>

        {/* Footer */}
        <p style={{ position: 'absolute', bottom: 56, left: 80, fontSize: 20, color: '#64748b' }}>
          Free explanation, diagram &amp; AI practice
        </p>
        <p style={{ position: 'absolute', bottom: 56, right: 80, fontSize: 18, color: '#475569' }}>
          frontcoach.app
        </p>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
