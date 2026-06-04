import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/og/session?id=<sessionId>
 * Generates a 1200×630 OG share image for a completed session.
 * Public — session data shown is intentionally minimal (score + topics).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });

  const summary = await prisma.sessionSummary.findFirst({
    where: { session: { id } },
    select: {
      overallScore: true,
      session: { select: { topics: true, difficulty: true, mode: true } },
    },
  });

  if (!summary) return new Response('Not found', { status: 404 });

  const score = summary.overallScore?.toFixed(1) ?? '—';
  const topics = summary.session.topics.slice(0, 3).join(' · ');
  const difficulty = summary.session.difficulty;
  const scoreNum = summary.overallScore ?? 0;
  const scoreColor = scoreNum >= 4 ? '#22c55e' : scoreNum >= 3 ? '#f59e0b' : '#ef4444';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, color: '#7c6af7' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c6af7' }} />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '0.08em', color: '#7c6af7' }}>
            FRONTEND COACH
          </span>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
          <span style={{ fontSize: 96, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 32, color: '#64748b', fontWeight: 500 }}>/&nbsp;5</span>
        </div>

        {/* Topics */}
        <p style={{ fontSize: 28, color: '#e2e8f0', fontWeight: 600, marginBottom: 16, lineHeight: 1.3 }}>
          {topics}
        </p>

        {/* Difficulty chip */}
        <div
          style={{
            display: 'flex',
            padding: '6px 18px',
            borderRadius: 999,
            background: '#1e1e30',
            border: '1px solid #2d2d4a',
            color: '#94a3b8',
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} level
        </div>

        {/* CTA */}
        <p
          style={{
            position: 'absolute',
            bottom: 56,
            right: 80,
            fontSize: 18,
            color: '#475569',
          }}
        >
          frontcoach.app
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
