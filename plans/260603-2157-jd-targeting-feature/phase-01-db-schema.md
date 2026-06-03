# Phase 1 — DB Schema

**Status:** Pending

## Changes to `prisma/schema.prisma`

### New model: `TargetJob`

```prisma
model TargetJob {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label     String   // user-set: "Stripe Senior FE"
  rawJd     String   @db.Text
  jdContext Json?    // extracted: { role, company?, level?, domain, requiredStack[], signals[] }
  createdAt DateTime @default(now())

  sessions  InterviewSession[]

  @@index([userId])
}
```

### Add to `User` model

```prisma
targetJobs  TargetJob[]
```

### Add to `InterviewSession` model

```prisma
label       String?   // auto-set from TargetJob.label at session creation
targetJobId String?
targetJob   TargetJob? @relation(fields: [targetJobId], references: [id], onDelete: SetNull)
```

`onDelete: SetNull` — if user deletes a TargetJob, existing sessions keep their label but lose the FK (question gen just won't have JD context for new questions in that session, which is edge-case-only since sessions are short).

## Migration

```bash
pnpm prisma migrate dev --name add-target-job
```

## Validation

- `prisma db pull` confirms table structure
- `prisma generate` succeeds
