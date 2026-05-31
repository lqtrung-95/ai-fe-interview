import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { uploadCvFile } from '@/lib/cv/cv-storage';
import { parseCvText } from '@/lib/cv/cv-parser';

/**
 * POST /api/cv/parse
 *
 * Two accepted payloads:
 *   1. multipart/form-data  { file: File }  — PDF or plain text upload
 *   2. application/json     { text: string } — plain text paste (no file stored)
 *
 * On success returns: { ok: true, cvData: CvData }
 * Privacy: cvData content is NOT written to AICall logs.
 */
export async function POST(request: Request) {
  const user = await requireUser();
  const contentType = request.headers.get('content-type') ?? '';

  let rawText: string;
  let storagePath: string | null = null;

  // ── File upload path ──────────────────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    // Extract text from the in-memory buffer first (no signed URL download needed)
    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.type === 'application/pdf') {
        // unpdf is designed for serverless/Next.js — works with Turbopack out of the box
        const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
        rawText = Array.isArray(text) ? text.join('\n') : (text ?? '');
        if (!rawText.trim()) {
          return NextResponse.json(
            { ok: false, error: 'No readable text found in this PDF. It may be a scanned/image-only document. Try copying and pasting the text instead.' },
            { status: 422 },
          );
        }
      } else {
        rawText = buffer.toString('utf-8');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[cv/parse] pdf extraction error:', msg);
      return NextResponse.json(
        { ok: false, error: `Failed to extract text from file: ${msg}` },
        { status: 500 },
      );
    }

    // Upload the original file to Supabase Storage for future re-parse
    try {
      storagePath = await uploadCvFile(user.id, file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      const status = msg.includes('too large') ? 413 : 400;
      return NextResponse.json({ ok: false, error: msg }, { status });
    }

  // ── Plain-text paste path ─────────────────────────────────────────────────
  } else if (contentType.includes('application/json')) {
    let body: { text?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json({ ok: false, error: 'text field is required' }, { status: 400 });
    }
    rawText = body.text;

  } else {
    return NextResponse.json(
      { ok: false, error: 'Content-Type must be multipart/form-data or application/json' },
      { status: 415 },
    );
  }

  // ── LLM parse ─────────────────────────────────────────────────────────────
  const cvData = await parseCvText(rawText);

  // ── Persist to User record ────────────────────────────────────────────────
  // NOTE: cvData content is NOT logged in AICall records (privacy constraint).
  await prisma.user.update({
    where: { id: user.id },
    data: {
      cvData: cvData as object,
      cvParsedAt: new Date(),
      ...(storagePath ? { cvFileUrl: storagePath } : {}),
    },
  });

  return NextResponse.json({ ok: true, cvData });
}
