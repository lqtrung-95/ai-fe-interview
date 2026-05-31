---
phase: 2
title: "CV Upload & LLM Parse"
status: pending
priority: P1
effort: "4h"
dependencies: [phase-01-db-schema-storage]
---

# Phase 2: CV Upload & LLM Parse

## Overview

Settings page gets a "CV Profile" card with file upload (PDF) and plain-text paste fallback.
On upload, a server action stores the file, calls the LLM to extract structured `CvData`,
and persists the result to `User.cvData`. User can preview parsed results and delete their CV.

## Requirements

- Functional:
  - Upload PDF (≤10 MB) or paste plain text in a textarea
  - Server action: upload → get signed URL → extract text (pdf-parse) → LLM parse → save
  - Display parsed summary: role list, skills, projects
  - Delete button: removes Storage file + clears `cvData`, `cvFileUrl`, `cvParsedAt`
  - Show "last parsed" timestamp with a "Re-parse" button (re-runs LLM on existing file)
- Non-functional:
  - LLM parse uses `cheap` tier (DeepSeek Chat — same as question generation; upgrade to smart/anthropic later if quality insufficient)
  - `cvContext` NEVER written to `AICall` logs (privacy)
  - Plain-text paste bypasses Storage upload (no file stored if user pastes)

## Architecture

```
src/app/api/cv/
  ├─ parse/route.ts      ← POST — multipart OR { text } JSON body
  │                           downloads signed URL → pdf-parse → LLM → save User
  └─ delete/route.ts     ← DELETE — removes file from Storage + clears User fields

src/lib/cv/
  └─ cv-parser.ts        ← server-only: parseCvText(rawText): Promise<CvData>
                              calls LLM with cv-parse-prompt, validates with cvDataSchema

src/lib/ai/prompts/
  └─ cv-parse-prompt.ts  ← buildCvParsePrompt(rawText): { system, user }

src/features/settings/components/
  └─ cv-profile-card.tsx ← Client component: upload UI, parsed preview, delete

src/app/(app)/settings/page.tsx  ← Add <CvProfileCard userId={user.id} cvData={user.cvData} … />
```

### LLM Parse Prompt Design

```
System: You are a CV parser for a frontend engineering interview prep app.
        Extract structured data from the CV text. Return ONLY valid JSON.
        Schema: { summary?, roles: [{company, title, duration?, highlights[]}],
                  skills[], projects: [{name, description, tech[]}], education? }
        - Keep highlights technical and concise (≤15 words each).
        - skills: include only technical skills (frameworks, languages, tools).
        - Omit soft skills, personal info, and formatting artifacts.

User: [raw CV text, truncated to 8000 chars]
```

### pdf-parse Note

Use the `pdf-parse` npm package (already available in many Next.js projects) or the
`pdfjs-dist` package. Since this runs server-side in a Route Handler, it's safe to use
Node.js-only packages. Add to `package.json` if missing.

### Plain-text paste flow

User pastes in textarea → clicks "Parse" → POST `/api/cv/parse` with `{ text: "…" }` body
→ skip Storage upload → run LLM parse → save `cvData` only (no `cvFileUrl`).

### File upload flow

1. Client sends multipart POST to `/api/cv/parse`
2. Route handler: extract `File` from formData
3. `uploadCvFile(userId, file)` → storage path
4. `getSignedCvUrl(path)` → signed URL (60 s)
5. Download raw bytes via `fetch(signedUrl)`
6. `pdfParse(buffer)` → raw text string
7. `parseCvText(rawText)` → `CvData`
8. `prisma.user.update({ cvData, cvFileUrl: path, cvParsedAt: new Date() })`
9. Return `{ ok: true, cvData }`

## Related Code Files

- Create: `src/app/api/cv/parse/route.ts`
- Create: `src/app/api/cv/delete/route.ts`
- Create: `src/lib/cv/cv-parser.ts`
- Create: `src/lib/ai/prompts/cv-parse-prompt.ts`
- Create: `src/features/settings/components/cv-profile-card.tsx`
- Modify: `src/app/(app)/settings/page.tsx`
- Add dep: `pdf-parse` (or `pdfjs-dist`) to `package.json`

## Implementation Steps

1. **`cv-parse-prompt.ts`** — write `buildCvParsePrompt(rawText: string)`. Truncate input to
   8000 chars, instruct LLM to return JSON only, no markdown fences.

2. **`cv-parser.ts`** — `parseCvText(rawText: string): Promise<CvData>`:
   - Call LLM via Vercel AI SDK `generateText` (smart tier, temperature 0.1)
   - Strip any ```json fences from response
   - `JSON.parse` → validate with `cvDataSchema`
   - On validation failure: return minimal `{ roles: [], skills: [] }` and log warning

3. **`src/app/api/cv/parse/route.ts`** — POST handler:
   - Authenticate with `requireUser()`
   - Check Content-Type: `multipart/form-data` (file) vs `application/json` (text paste)
   - File path: validate MIME, call `uploadCvFile`, get signed URL, download, `pdfParse`
   - Text path: use body.text directly
   - Call `parseCvText` → update User → return `cvData`
   - **Do not** include `cvData` content in any error logs / AICall records

4. **`src/app/api/cv/delete/route.ts`** — DELETE handler:
   - Authenticate
   - `deleteCvFile(user.cvFileUrl)` if set
   - `prisma.user.update({ cvData: null, cvFileUrl: null, cvParsedAt: null })`

5. **`cv-profile-card.tsx`** — client component:
   - State: `uploading`, `parsing`, `error`, `cvData` (from props, updated after parse)
   - File input (PDF only, accept=".pdf,.txt") + plain-text textarea (tabbed)
   - On file select: POST multipart to `/api/cv/parse`, show spinner
   - On parse success: show parsed preview (roles, skills, projects list)
   - "Delete CV" button → DELETE `/api/cv/delete` → clear local state
   - "Re-parse" button (only shown if `cvFileUrl` exists) → re-POSTs to trigger re-parse

6. **`settings/page.tsx`** — add `<CvProfileCard>` section below existing cards.
   Pass `cvData={user.cvData}`, `cvFileUrl={user.cvFileUrl}`, `cvParsedAt={user.cvParsedAt}`.

## Success Criteria

- [ ] PDF upload → spinner → parsed roles/skills displayed in card
- [ ] Plain-text paste → parsed correctly
- [ ] Delete → card resets to empty state; `User.cvData` is null in DB
- [ ] Re-parse → fresh `cvData` without re-uploading
- [ ] Invalid file type (e.g. `.exe`) → rejected with 400
- [ ] File > 10 MB → rejected with 413
- [ ] `AICall` table has no rows containing CV text

## Risk Assessment

- **pdf-parse reliability**: complex PDF layouts (columns, tables) produce garbled text.
  Mitigation: show user a "preview raw text" toggle before parse so they can spot issues.
  Fallback: plain-text paste always available.
- **LLM JSON reliability**: model may wrap output in markdown. Mitigation: strip fences,
  validate with Zod, return empty-ish fallback rather than 500.
