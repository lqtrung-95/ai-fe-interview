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
 * Server-side speech-to-text. The browser records audio (MediaRecorder, works in
 * every browser) and uploads it here; we transcribe via Groq's Whisper. This
 * replaces the Web Speech API, which only has a working backend in Chrome.
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
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

  // Forward to Groq's OpenAI-compatible Whisper endpoint.
  const groqForm = new FormData();
  groqForm.append('file', file, `answer.${extFor(file.type)}`);
  groqForm.append('model', 'whisper-large-v3-turbo');
  groqForm.append('response_format', 'json');
  groqForm.append('language', 'en');
  groqForm.append('temperature', '0');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[transcribe] groq error', res.status, detail.slice(0, 300));
      return NextResponse.json({ error: 'transcription_failed' }, { status: 502 });
    }
    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: (data.text ?? '').trim() });
  } catch (err) {
    console.error('[transcribe] failed', err);
    return NextResponse.json({ error: 'transcription_failed' }, { status: 502 });
  }
}
