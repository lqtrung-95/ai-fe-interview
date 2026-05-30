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

const LOG = true; // set false to silence debug output
const log = (...args: unknown[]) => LOG && console.log('[SpeechRec]', ...args);

/**
 * Continuous Web Speech API wrapper for the answer textarea.
 *
 * Key design decisions:
 * - A FRESH SpeechRecognition instance is created on every restart (including
 *   the auto-restart in `onend`). Reusing the same instance after `onend` fires
 *   is unreliable in Chrome/Edge — the engine often garbage-collects it, causing
 *   a silent failure that makes the mic appear to stop immediately.
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
  log('isSupported:', isSupported, '| ctor:', typeof window !== 'undefined'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? `SpeechRecognition=${!!(window as any).SpeechRecognition} webkitSpeechRecognition=${!!(window as any).webkitSpeechRecognition}`
    : 'SSR');

  const setStatusBoth = useCallback((s: SpeechStatus) => {
    log('setStatus:', s);
    statusRef.current = s;
    setStatus(s);
  }, []);

  // Forward-ref so onend can call startSession without a stale closure.
  const startSessionRef = useRef<() => void>(() => {});
  // Tracks consecutive network errors; resets on a successful transcript.
  // Edge routes speech through Microsoft servers — transient failures are common.
  const networkErrorsRef = useRef(0);
  const MAX_NETWORK_ERRORS = 4;

  const startSession = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    log('startSession called | Ctor:', !!Ctor, '| statusRef:', statusRef.current);
    if (!Ctor || statusRef.current !== 'listening') {
      log('startSession: bailing out');
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    log('recognition instance created, calling .start()');

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      networkErrorsRef.current = 0; // successful audio → reset network error counter
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript;
      }
      log('onresult | finalChunk:', JSON.stringify(finalChunk));
      if (finalChunk) onTranscriptRef.current(finalChunk);
    };

    recognition.onerror = (event) => {
      log('onerror | error:', event.error, '| statusRef:', statusRef.current, '| networkErrors:', networkErrorsRef.current);
      if (event.error === 'network') {
        // Edge/Chrome send audio to cloud speech servers; transient network
        // failures are common. Let onend handle the restart up to MAX_NETWORK_ERRORS.
        networkErrorsRef.current += 1;
        if (networkErrorsRef.current > MAX_NETWORK_ERRORS) {
          log('onerror: too many network errors, going idle');
          setStatusBoth('idle');
        } else {
          log('onerror: network error #', networkErrorsRef.current, '— letting onend restart');
        }
        return;
      }
      // 'aborted'  → intentional stop via recognition.stop(), ignore.
      // 'no-speech'→ silence window expired; onend fires next, we restart there.
      const ignored = new Set(['aborted', 'no-speech']);
      if (!ignored.has(event.error)) {
        log('onerror: non-ignored error, going idle');
        setStatusBoth('idle');
      }
    };

    recognition.onend = () => {
      log('onend | statusRef:', statusRef.current);
      // Edge/Chrome tears down the recognition object after onend — do NOT call
      // recognition.start() on the old instance. Create a fresh one instead.
      if (statusRef.current === 'listening') {
        log('onend: still listening, restarting fresh session');
        startSessionRef.current();
      } else {
        log('onend: status is not listening, NOT restarting');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      log('.start() succeeded');
    } catch (err) {
      log('.start() threw:', err);
      setStatusBoth('idle');
    }
  }, [setStatusBoth]);

  // Keep the ref in sync with the latest startSession closure.
  startSessionRef.current = startSession;

  const start = useCallback(() => {
    log('start() called');
    networkErrorsRef.current = 0;
    setStatusBoth('listening');
    startSession();
  }, [setStatusBoth, startSession]);

  const stop = useCallback(() => {
    log('stop() called');
    setStatusBoth('idle');           // set BEFORE .stop() so onend sees idle
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [setStatusBoth]);

  const toggle = useCallback(() => {
    log('toggle() | statusRef:', statusRef.current);
    if (statusRef.current === 'listening') stop();
    else start();
  }, [start, stop]);

  // Release the microphone on unmount.
  useEffect(() => () => {
    log('unmount cleanup');
    statusRef.current = 'idle';     // prevent onend from restarting after unmount
    recognitionRef.current?.stop();
  }, []);

  return {
    status: isSupported ? status : ('unsupported' as const),
    toggle,
    stop,
  };
}
