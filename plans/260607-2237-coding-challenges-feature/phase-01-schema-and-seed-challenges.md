---
phase: 1
title: "Schema + Seed Challenges"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Schema + Seed Challenges

## Overview

Add `CodingChallenge` and `CodingSubmission` Prisma models, migrate the DB, and seed 15 curated JavaScript challenges relevant to frontend interviews.

## Architecture

```
CodingChallenge (seed content, static)
  id, title, description, difficulty, topic, tags[]
  starterCode    — template shown in editor
  testCases      — Json: { id, input, expected, isHidden, label }[]
  solution       — reference solution (never exposed to client)
  timeLimit      — ms for Piston execution (default 5000)

CodingSubmission (user attempts)
  id, userId, challengeId
  code           — submitted code
  language       — "javascript" (fixed for MVP)
  status         — "passed" | "failed" | "error"
  testResults    — Json: per-test { id, passed, actual, error? }[]
  passedCount, totalCount
  executionMs
  aiReview       — nullable Text, populated by Phase 5
  createdAt
```

**Test case structure (Json column):**
```ts
type TestCase = {
  id: string;
  label: string;        // e.g. "handles empty array"
  input: string;        // JS expression passed to fn, e.g. "([1,[2,3]], 1)"
  expected: string;     // JSON-serialised expected output
  isHidden: boolean;    // hidden cases shown only as pass/fail count
};
```

## Related Code Files

- Create: `prisma/schema.prisma` (modify — add 2 new models)
- Create: `prisma/migrations/...` (auto-generated)
- Create: `prisma/seeds/coding-challenges-seed.ts`
- Modify: `package.json` — add `seed:coding` script

## Implementation Steps

### 1. Prisma schema additions

Append to `prisma/schema.prisma`:

```prisma
model CodingChallenge {
  id          String     @id
  title       String
  description String     @db.Text
  difficulty  Difficulty
  topic       String
  tags        String[]
  starterCode String     @db.Text
  testCases   Json
  solution    String     @db.Text
  timeLimit   Int        @default(5000)
  createdAt   DateTime   @default(now())

  submissions CodingSubmission[]

  @@index([difficulty])
  @@index([topic])
}

model CodingSubmission {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  challengeId String
  challenge   CodingChallenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  code        String   @db.Text
  language    String   @default("javascript")
  status      String
  testResults Json
  passedCount Int
  totalCount  Int
  executionMs Int?
  aiReview    String?  @db.Text
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([challengeId])
}
```

Also add `submissions CodingSubmission[]` to the `User` model relation.

### 2. Run migration

```bash
pnpm db:migrate
pnpm db:generate
```

### 3. Seed file

Create `prisma/seeds/coding-challenges-seed.ts` with 15 challenges. Each challenge must have:
- Visible test cases (≥ 3) + hidden test cases (≥ 2) for anti-gaming
- A `starterCode` function stub matching the input/output contract
- A working `solution` (validated locally before seeding)

**15 challenges to seed:**

| id | title | difficulty | topic |
|----|-------|-----------|-------|
| `cc-debounce` | Implement debounce | mid | JavaScript |
| `cc-throttle` | Implement throttle | mid | JavaScript |
| `cc-flatten` | Flatten nested array | junior | JavaScript |
| `cc-deep-clone` | Deep clone an object | mid | JavaScript |
| `cc-promise-all` | Implement Promise.all | mid | Async |
| `cc-promise-race` | Implement Promise.race | mid | Async |
| `cc-event-emitter` | Build EventEmitter class | mid | JavaScript |
| `cc-memoize` | Implement memoize | junior | JavaScript |
| `cc-curry` | Implement curry | senior | JavaScript |
| `cc-compose` | Implement compose/pipe | mid | JavaScript |
| `cc-virtual-dom-diff` | Diff two virtual DOM trees | senior | React |
| `cc-use-debounce` | Implement useDebounce hook | mid | React |
| `cc-observable` | Implement simple Observable | senior | Async |
| `cc-lru-cache` | LRU Cache implementation | senior | JavaScript |
| `cc-retry` | Implement retry with backoff | mid | Async |

### 4. Add seed script

In `package.json`, add:
```json
"seed:coding": "tsx prisma/seeds/coding-challenges-seed.ts"
```

Run: `pnpm seed:coding`

## Success Criteria

- [ ] `pnpm db:generate` succeeds without errors
- [ ] `pnpm db:migrate` creates the two new tables
- [ ] `pnpm seed:coding` inserts 15 challenges with valid test cases
- [ ] Each challenge's solution passes all its own test cases (verified by running `node -e` locally)
- [ ] `pnpm typecheck` passes

## Risk Assessment

- **Test case input format**: Piston executes arbitrary JS; test inputs must be valid JS expressions. Keep inputs as serialisable values (arrays, objects, primitives) — no DOM refs.
- **Hidden test cases**: Must not be accessible via client-side API. The `solution` and `isHidden` test case expected values are never returned to the browser.
