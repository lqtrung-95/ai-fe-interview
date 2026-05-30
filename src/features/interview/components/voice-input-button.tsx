'use client';

import { Mic, MicOff, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SpeechStatus } from '../hooks/use-speech-recognition';

interface Props {
  status: SpeechStatus;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Mic button that reflects speech-recognition state.
 *
 * - Hidden entirely when status === 'unsupported' (no SpeechRecognition API).
 * - Animates with primary colour while listening.
 * - Shows amber warning icon when speech service is unreachable (network-failed).
 */
export function VoiceInputButton({ status, onToggle, disabled }: Props) {
  if (status === 'unsupported') return null;

  const isListening = status === 'listening';
  const isNetworkFailed = status === 'network-failed';

  const label = isListening
    ? 'Stop recording'
    : isNetworkFailed
      ? 'Voice unavailable — click to retry'
      : 'Record answer by voice';

  const className =
    'h-9 w-9 transition ' +
    (isListening
      ? 'border-primary bg-primary/10 text-primary animate-pulse'
      : isNetworkFailed
        ? 'border-amber-500/60 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
        : 'text-muted-foreground hover:text-foreground');

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={className}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : isNetworkFailed ? (
        <WifiOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
