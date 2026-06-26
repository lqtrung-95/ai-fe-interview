import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { guardGeneralLimit } from '@/lib/rate-limit/guard';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Generous ceiling — a few minutes of Opus audio is well under this. Guards
// against someone uploading huge files to run up transcription cost.
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

/** Picks a Whisper-friendly filename extension from the uploaded blob's type. */
function extFor(type: string): string {
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) return 'mp4';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('wav')) return 'wav';
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  return 'webm';
}

/**
 * Calls a Whisper-compatible transcription endpoint.
 * Returns the transcript string, or throws on failure.
 */
async function callWhisper(
  apiKey: string,
  endpoint: string,
  model: string,
  file: Blob,
  ext: string,
): Promise<string> {
  const form = new FormData();
  form.append('file', file, `answer.${ext}`);
  form.append('model', model);
  form.append('response_format', 'json');
  form.append('language', 'en');
  form.append('temperature', '0');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${res.status} ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim();
}

/**
 * Server-side speech-to-text. Tries Groq Whisper first (free tier); falls
 * back to OpenAI Whisper ($0.006/min) if Groq is unavailable or rate-limited.
 * Replaces the Web Speech API which only works in Chrome.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const limited = await guardGeneralLimit(user.id);
  if (limited) return limited;

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if ((!groqKey || groqKey.includes('placeholder')) && (!openaiKey || openaiKey.includes('placeholder'))) {
    return NextResponse.json({ error: 'transcription_unavailable' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = form.get('audio');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'no_audio' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'bad_size' }, { status: 400 });
  }

  const ext = extFor(file.type);

  // Try Groq first (free), fall back to OpenAI on rate-limit or error.
  if (groqKey && !groqKey.includes('placeholder')) {
    try {
      const text = await callWhisper(
        groqKey,
        'https://api.groq.com/openai/v1/audio/transcriptions',
        'whisper-large-v3-turbo',
        file,
        ext,
      );
      return NextResponse.json({ text });
    } catch (err) {
      console.warn('[transcribe] groq failed, trying openai fallback:', err instanceof Error ? err.message : err);
    }
  }

  // OpenAI fallback
  if (openaiKey && !openaiKey.includes('placeholder')) {
    try {
      const text = await callWhisper(
        openaiKey,
        'https://api.openai.com/v1/audio/transcriptions',
        'whisper-1',
        file,
        ext,
      );
      return NextResponse.json({ text });
    } catch (err) {
      console.error('[transcribe] openai fallback failed:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ error: 'transcription_failed' }, { status: 502 });
}
