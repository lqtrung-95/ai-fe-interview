'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  shareUrl: string;
  score: number | null;
}

export function ShareSessionButton({ shareUrl, score }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = score !== null
      ? `I scored ${score.toFixed(1)}/5 on a Frontend Coach interview session 🎯`
      : 'Check out my Frontend Coach interview session';

    // Use Web Share API on mobile, clipboard fallback on desktop
    if (navigator.share) {
      await navigator.share({ title: 'Frontend Coach — Session result', text, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={buttonVariants({ variant: 'outline', size: 'lg' })}
    >
      {copied ? (
        <><Check className="size-4" /> Copied!</>
      ) : (
        <><Share2 className="size-4" /> Share result</>
      )}
    </button>
  );
}
