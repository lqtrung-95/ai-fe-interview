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
 * - Pulses with a red ring while listening to give clear visual feedback.
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
          ? 'border-red-500 text-red-500 ring-2 ring-red-500/30 hover:border-red-400 hover:text-red-400'
          : '')
      }
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
