'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'listening' | 'unsupported';

interface Options {
  /** Called with each confirmed (final) transcript segment. */
  onTranscript: (text: string) => void;
}

// The Web Speech API is not fully typed in TypeScript's DOM lib — webkit prefix
// and some event types are missing. Define minimal local interfaces to satisfy the compiler.
interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface ISpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; readonly [i: number]: ISpeechRecognitionResult };
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

/**
 * Thin wrapper around the browser-native Web Speech API.
 *
 * - Uses continuous + interimResults mode so words stream in while the user speaks.
 * - Only confirmed final segments are forwarded to `onTranscript` to avoid
 *   duplicating text already appended to the answer draft.
 * - Auto-restarts on `onend` (Chrome stops after ~60 s of silence).
 * - Returns `status === 'unsupported'` when SpeechRecognition is unavailable
 *   (Firefox, non-HTTPS, etc.) so the UI can hide the button gracefully.
 */
export function useSpeechRecognition({ onTranscript }: Options) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  // Stable ref so the restart logic sees current status without stale closure.
  const statusRef = useRef<SpeechStatus>('idle');

  const isSupported = !!getSpeechRecognitionCtor();

  const setStatusBoth = useCallback((s: SpeechStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatusBoth('idle');
  }, [setStatusBoth]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript;
      }
      if (finalChunk) onTranscript(finalChunk);
    };

    recognition.onerror = (event) => {
      // 'aborted'  → intentional stop, ignore.
      // 'no-speech'→ Chrome fires this after a silence window; the 'end' event
      //              fires next and our restart logic handles it — don't reset.
      const ignored = new Set(['aborted', 'no-speech']);
      if (!ignored.has(event.error)) setStatusBoth('idle');
    };

    recognition.onend = () => {
      // Auto-restart so the session doesn't silently cut off in Chrome.
      if (statusRef.current !== 'listening') return;
      try {
        recognition.start();
      } catch {
        // If the same instance can't restart (browser garbage-collected it),
        // fall back to idle so the user can click the mic again.
        setStatusBoth('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatusBoth('listening');
  }, [onTranscript, setStatusBoth]);

  const toggle = useCallback(() => {
    if (statusRef.current === 'listening') stop();
    else start();
  }, [start, stop]);

  // Release the microphone on unmount.
  useEffect(() => () => recognitionRef.current?.stop(), []);

  return {
    status: isSupported ? status : ('unsupported' as const),
    toggle,
    stop,
  };
}
