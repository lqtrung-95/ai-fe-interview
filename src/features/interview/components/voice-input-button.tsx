'use client';

import { Mic, MicOff } from 'lucide-react';
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
 * - Animates with primary colour while listening (distinct from error styling).
 */
export function VoiceInputButton({ status, onToggle, disabled }: Props) {
  if (status === 'unsupported') return null;

  const isListening = status === 'listening';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      disabled={disabled}
      aria-label={isListening ? 'Stop recording' : 'Record answer by voice'}
      title={isListening ? 'Stop recording' : 'Record answer by voice'}
      className={
        'h-9 w-9 transition ' +
        (isListening
          ? 'border-primary bg-primary/10 text-primary animate-pulse'
          : 'text-muted-foreground hover:text-foreground')
      }
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
