# Phase 3 — TargetJob CRUD

**Status:** Pending

## Server actions — `src/features/target-jobs/server/target-job-service.ts`

### `listTargetJobs(userId)`
Returns `TargetJob[]` ordered by `createdAt desc`. Used by settings page and session form.

### `createTargetJob({ userId, label, rawJd })`
1. Guard: `user.isPro` — return `{ ok: false, code: 'not_pro' }` if not
2. Guard: count existing → if >= 3 return `{ ok: false, code: 'limit_reached' }`
3. Call `runAITask({ type: 'extract_jd', input: { rawJd: truncate(rawJd, 6000) } })`
4. Insert `TargetJob` row with extracted `jdContext`
5. Return `{ ok: true, targetJob }`

### `deleteTargetJob({ userId, id })`
1. Verify ownership (`findFirst` with `userId` guard)
2. Delete row — cascade `onDelete: SetNull` on sessions handles FK automatically

## API route — `src/app/api/target-jobs/route.ts`

```
GET  /api/target-jobs        → listTargetJobs for current user
POST /api/target-jobs        → createTargetJob  body: { label, rawJd }
DELETE /api/target-jobs?id=  → deleteTargetJob
```

All routes call `requireUser()` and delegate to service functions. Return JSON `{ ok, data?, error?, code? }`.

## Input validation

```typescript
const createSchema = z.object({
  label: z.string().min(1).max(60).trim(),
  rawJd: z.string().min(50).max(20000).trim(),
});
```

`label` max 60 chars — shown in chips and session headers.  
`rawJd` max 20 000 chars — truncated to 6 000 before AI call.

## Error codes

| Code | Meaning |
|------|---------|
| `not_pro` | User is not Pro |
| `limit_reached` | Already has 3 saved JDs |
| `extraction_failed` | AI call threw (rare) |
