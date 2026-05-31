---
phase: 1
title: "DB Schema & Storage"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: DB Schema & Storage

## Overview

Add three fields to the `User` Prisma model for CV data, create the private Supabase Storage
bucket, and write the low-level storage helper module. No UI yet — just the foundation.

## Requirements

- Functional:
  - `User.cvData Json?` — parsed CvData object (see plan overview for shape)
  - `User.cvFileUrl String?` — Supabase Storage path (NOT a public URL), e.g. `cvs/{userId}/resume.pdf`
  - `User.cvParsedAt DateTime?` — timestamp of last successful parse (for staleness hints)
  - Supabase Storage bucket `cvs` — private, 10 MB file size limit, PDF/txt only
- Non-functional:
  - Migration is additive/nullable — no existing rows affected
  - Storage helper validates MIME type before upload to prevent abuse

## Architecture

```
prisma/schema.prisma
  └─ User model += cvData, cvFileUrl, cvParsedAt

src/lib/cv/
  ├─ cv-types.ts          ← CvData interface + zod schema for validation
  └─ cv-storage.ts        ← uploadCvFile(), deleteCvFile(), getSignedUrl()
                             (server-only, uses supabase-server client)
```

Supabase bucket policy: authenticated users can only read/write their own prefix
(`cvs/{userId}/*`). Enforced via RLS policy on the bucket.

## Related Code Files

- Modify: `prisma/schema.prisma` (User model)
- Create: `prisma/migrations/…_add_cv_fields_to_user.sql` (auto-generated)
- Create: `src/lib/cv/cv-types.ts`
- Create: `src/lib/cv/cv-storage.ts`

## Implementation Steps

1. **Edit `prisma/schema.prisma`** — add to `model User`:
   ```prisma
   cvFileUrl  String?   // Supabase Storage path: cvs/{userId}/resume.pdf
   cvData     Json?     // Parsed CvData JSON (see cv-types.ts)
   cvParsedAt DateTime? // When cvData was last extracted
   ```

2. **Run migration**:
   ```bash
   pnpm db:migrate --name add_cv_fields_to_user
   pnpm db:generate
   ```

3. **Create `src/lib/cv/cv-types.ts`** — `CvData` TypeScript interface + `cvDataSchema`
   Zod schema (mirrors the shape in plan overview). Export both.

4. **Create Supabase Storage bucket `cvs`** — in the Supabase dashboard:
   - New bucket: `cvs`, **not public**
   - Add RLS policy: authenticated users can INSERT/SELECT/DELETE objects under `cvs/{auth.uid()}/`
   - File size limit: 10 MB

5. **Create `src/lib/cv/cv-storage.ts`** — `server-only` module:
   ```ts
   // uploadCvFile(userId, file: File): Promise<string>
   //   → validates MIME (application/pdf | text/plain)
   //   → uploads to cvs/{userId}/resume.<ext>
   //   → returns the storage path (not a URL)
   //
   // deleteCvFile(storagePath: string): Promise<void>
   //
   // getSignedCvUrl(storagePath: string, expiresIn = 60): Promise<string>
   //   → returns a signed URL (TTL 60 s) for the API parse route to download
   ```
   Use `createSupabaseServerClient()` from `@/lib/auth/supabase-server`.

## Success Criteria

- [ ] `pnpm db:generate` succeeds with the three new User fields
- [ ] `prisma.user.findFirst()` returns `cvData`, `cvFileUrl`, `cvParsedAt` fields
- [ ] `cv-storage.ts` compiles with no TS errors
- [ ] `cv-types.ts` `cvDataSchema.parse({})` → passes (all fields optional except `roles`)
- [ ] Supabase bucket `cvs` is private; public URL returns 403

## Risk Assessment

- Migration is purely additive (nullable fields) — zero data loss risk.
- RLS bucket policy misconfiguration could expose other users' CVs — test policy with a second test user before Phase 2.
