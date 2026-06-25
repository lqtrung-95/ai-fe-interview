'use client';

import { Loader2, Mic, Square, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecorderStatus } from '../hooks/use-audio-transcription';

interface Props {
  status: RecorderStatus;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Mic button for record-then-transcribe voice input.
 * - Hidden when 'unsupported' (no MediaRecorder).
 * - 'recording' → red stop icon, pulsing.
 * - 'transcribing' → spinner (and disabled).
 * - 'error' → amber warning; click to retry.
 */
export function VoiceInputButton({ status, onToggle, disabled }: Props) {
  if (status === 'unsupported') return null;

  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';
  const isError = status === 'error';

  const label = isRecording
    ? 'Stop & transcribe'
    : isTranscribing
      ? 'Transcribing…'
      : isError
        ? 'Voice failed — click to retry'
        : 'Record answer by voice';

  const className =
    'h-9 w-9 transition ' +
    (isRecording
      ? 'border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse'
      : isError
        ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'text-muted-foreground hover:text-foreground');

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      disabled={disabled || isTranscribing}
      aria-label={label}
      title={label}
      className={className}
    >
      {isRecording ? (
        <Square className="h-4 w-4" />
      ) : isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isError ? (
        <TriangleAlert className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
