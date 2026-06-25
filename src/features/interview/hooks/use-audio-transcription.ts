'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'transcribing' | 'error' | 'unsupported';

interface Options {
  /** Called with the transcribed text once recording stops and STT returns. */
  onTranscript: (text: string) => void;
}

/** First MediaRecorder mime type the browser supports (Chrome/Edge → webm, Safari → mp4). */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

/**
 * Record-then-transcribe voice input that works in EVERY browser. Captures audio
 * with MediaRecorder (universally supported), uploads it to /api/transcribe, and
 * returns the text. Replaces the Web Speech API, whose cloud backend only works
 * in Chrome (Brave strips it; Edge/Safari lack it on macOS).
 */
export function useAudioTranscription({ onTranscript }: Options) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  function releaseStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  const flashError = useCallback(() => {
    setStatus('error');
    setTimeout(() => setStatus((s) => (s === 'error' ? 'idle' : s)), 4000);
  }, []);

  const transcribe = useCallback(
    async (blob: Blob) => {
      setStatus('transcribing');
      try {
        const form = new FormData();
        form.append('audio', blob, 'answer');
        const res = await fetch('/api/transcribe', { method: 'POST', body: form });
        if (!res.ok) {
          flashError();
          return;
        }
        const data = (await res.json()) as { text?: string };
        const text = (data.text ?? '').trim();
        if (text) onTranscriptRef.current(text);
        setStatus('idle');
      } catch {
        flashError();
      }
    },
    [flashError],
  );

  const start = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        releaseStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) void transcribe(blob);
        else setStatus('idle');
      };
      recorderRef.current = recorder;
      recorder.start();
      setStatus('recording');
    } catch {
      // Permission denied, no mic, or recorder failure.
      releaseStream();
      flashError();
    }
  }, [supported, transcribe, flashError]);

  const stop = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') r.stop(); // onstop → transcribe
    recorderRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (status === 'recording') stop();
    else if (status !== 'transcribing') void start();
  }, [status, start, stop]);

  // Release the mic on unmount.
  useEffect(
    () => () => {
      const r = recorderRef.current;
      if (r && r.state !== 'inactive') r.stop();
      releaseStream();
    },
    [],
  );

  return { status: supported ? status : ('unsupported' as const), toggle, stop };
}
