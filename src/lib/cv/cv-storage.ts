import 'server-only';

/**
 * Supabase Storage helpers for CV file upload/download/delete.
 *
 * Bucket: `cvs` (private — never public URLs).
 * All user files live under `cvs/{userId}/resume.<ext>`.
 *
 * Uses the service-role key (bypasses RLS) because these operations run
 * server-side in Route Handlers where the anon-key session client can't
 * reliably pass the user JWT to the storage API.
 * User identity is enforced by `requireUser()` at the route level — the
 * userId is always explicitly scoped into the storage path.
 */

import { createClient } from '@supabase/supabase-js';
import { CV_ALLOWED_MIME, type CvMimeType } from './cv-types';

/** Service-role Supabase client — server-side only, bypasses RLS. */
function getStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const BUCKET = 'cvs';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Derive storage path from userId + MIME type. */
function storagePath(userId: string, mime: CvMimeType): string {
  const ext = mime === 'application/pdf' ? 'pdf' : 'txt';
  return `${userId}/resume.${ext}`;
}

/**
 * Upload a CV file to Supabase Storage.
 * Validates MIME type and file size before uploading.
 * Overwrites any existing file at the same path (one CV per user).
 *
 * @returns The storage path (NOT a public URL), e.g. `{userId}/resume.pdf`.
 */
export async function uploadCvFile(userId: string, file: File): Promise<string> {
  const mime = file.type as CvMimeType;
  if (!(CV_ALLOWED_MIME as readonly string[]).includes(mime)) {
    throw new Error(`Unsupported file type: ${mime}. Only PDF and plain text are allowed.`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`);
  }

  const supabase = getStorageClient();
  const path = storagePath(userId, mime);
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mime,
      upsert: true, // overwrite on re-upload
    });

  if (error) throw new Error(`CV upload failed: ${error.message}`);
  return path;
}

/**
 * Delete a CV file from Supabase Storage.
 * No-ops silently if the file doesn't exist.
 */
export async function deleteCvFile(storagePath: string): Promise<void> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error(`CV delete failed: ${error.message}`);
}

/**
 * Generate a short-lived signed URL for the CV file (default TTL: 60 s).
 * Used by the parse route to download the file server-side without exposing a public URL.
 */
export async function getSignedCvUrl(
  storagePath: string,
  expiresIn = 60,
): Promise<string> {
  const supabase = getStorageClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown'}`);
  }
  return data.signedUrl;
}
