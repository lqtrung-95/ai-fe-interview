'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'listening' | 'unsupported';

interface Options {
  /** Called with each confirmed (final) transcript segment. */
  onTranscript: (text: string) => void;
}

// The Web Speech API is not fully typed in TypeScript's DOM lib.
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
 * Continuous Web Speech API wrapper for the answer textarea.
 *
 * Key design decisions:
 * - A FRESH SpeechRecognition instance is created on every restart (including
 *   the auto-restart in `onend`). Reusing the same instance after `onend` fires
 *   is unreliable in Chrome — the engine often garbage-collects it, causing a
 *   silent failure that makes the mic appear to stop immediately.
 * - `onTranscript` is accessed through a ref so the recognition callback always
 *   uses the latest version without needing to recreate the recognition object
 *   on every render (which would break the session mid-speech).
 * - 'no-speech' and 'aborted' errors are ignored; both are handled by `onend`.
 */
export function useSpeechRecognition({ onTranscript }: Options) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const statusRef = useRef<SpeechStatus>('idle');

  // Keep a stable ref so the recognition callback always uses the latest handler
  // without being re-created mid-session when the parent re-renders.
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const isSupported = !!getSpeechRecognitionCtor();

  const setStatusBoth = useCallback((s: SpeechStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // Forward-ref so onend can call startSession without a stale closure.
  const startSessionRef = useRef<() => void>(() => {});

  const startSession = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || statusRef.current !== 'listening') return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript;
      }
      if (finalChunk) onTranscriptRef.current(finalChunk);
    };

    recognition.onerror = (event) => {
      // 'aborted'  → intentional stop via recognition.stop(), ignore.
      // 'no-speech'→ silence window expired; onend fires next, we restart there.
      const ignored = new Set(['aborted', 'no-speech']);
      if (!ignored.has(event.error)) setStatusBoth('idle');
    };

    recognition.onend = () => {
      // Chrome tears down the recognition object after onend — do NOT call
      // recognition.start() on the old instance. Create a fresh one instead.
      if (statusRef.current === 'listening') {
        startSessionRef.current();
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setStatusBoth('idle');
    }
  }, [setStatusBoth]);

  // Keep the ref in sync with the latest startSession closure.
  startSessionRef.current = startSession;

  const start = useCallback(() => {
    setStatusBoth('listening');
    startSession();
  }, [setStatusBoth, startSession]);

  const stop = useCallback(() => {
    setStatusBoth('idle');           // set BEFORE .stop() so onend sees idle
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [setStatusBoth]);

  const toggle = useCallback(() => {
    if (statusRef.current === 'listening') stop();
    else start();
  }, [start, stop]);

  // Release the microphone on unmount.
  useEffect(() => () => {
    statusRef.current = 'idle';     // prevent onend from restarting after unmount
    recognitionRef.current?.stop();
  }, []);

  return {
    status: isSupported ? status : ('unsupported' as const),
    toggle,
    stop,
  };
}
