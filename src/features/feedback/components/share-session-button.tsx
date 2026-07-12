'use client';

import { useState } from 'react';
import { Share2, Check, Loader2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  sessionId: string;
  score: number | null;
}

export function ShareSessionButton({ sessionId, score }: Props) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share-token`, { method: 'POST' });
      if (!res.ok) return;
      const { token } = await res.json() as { token: string };
      const shareUrl = `${window.location.origin}/share/${token}`;

      const text = score !== null
        ? `I scored ${score.toFixed(1)}/5 on a Frontend Coach interview session 🎯`
        : 'Check out my Frontend Coach interview session';

      if (navigator.share) {
        await navigator.share({ title: 'Frontend Coach — Session result', text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className={buttonVariants({ variant: 'outline', size: 'lg' })}
    >
      {copied ? (
        <><Check className="size-4" /> Copied!</>
      ) : loading ? (
        <><Loader2 className="size-4 animate-spin" /> Preparing…</>
      ) : (
        <><Share2 className="size-4" /> Share result</>
      )}
    </button>
  );
}
