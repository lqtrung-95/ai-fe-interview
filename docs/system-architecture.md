# System Architecture — AI Interview Coach

**Status:** Draft v1
**Last updated:** 2026-05-27
**Owner:** trungle030195@gmail.com

Reference: [PRD.md](../PRD.md)

---

## 1. Goals

1. Realistic AI-led mock interviews with structured, rubric-grounded feedback.
2. Streaming UX — never a blank loading wall while AI thinks.
3. Cost-aware — model tiering + telemetry from day 1.
4. Voice-ready boundaries even though MVP is text-only.
5. Single deploy unit on Vercel, single Postgres (Supabase) for MVP.

Non-goals (MVP): mobile app, video, payments, live coding sandbox, peer matching.

---

## 2. Tech Stack

| Layer | Choice | Justification |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19.2 | RSC streaming, SSE built-in, Turbopack default, single deploy. Note: `proxy.ts` replaces `proxy.ts`; `cookies()`/`headers()`/`params`/`searchParams` are all async. |
| Language | TypeScript (strict) | AI JSON contracts require schema enforcement |
| Styling | Tailwind v4 + shadcn/ui | "Calm/focused" design principle (PRD §12.1) |
| Server cache | TanStack Query v5 | Streaming-aware, optimistic mutations |
| Client state | Zustand | Lightweight interview-flow state machine |
| ORM | Prisma | Type-safe queries, migrations |
| DB | Supabase Postgres | Bundles auth + storage; pgvector available for post-MVP |
| Auth | Supabase Auth (`@supabase/ssr`) | Email magic link + Google OAuth; guest mode via anon key |
| AI SDK | Vercel AI SDK v5 | Provider-agnostic streaming + `generateObject` (Zod-validated) |
| LLM | OpenAI + Anthropic (router) | Tier by cost: cheap for question gen, premium for evaluation |
| Validation | Zod | Shared schema across API + AI structured output |
| Charts | Recharts | Dashboard radar + trend lines |
| Rate limit | Upstash Redis | Edge-friendly, serverless free tier |
| Analytics | PostHog | PRD §20 events, funnels, session replay |
| Hosting | Vercel | Streaming, edge middleware, hobby tier |

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser (Next.js App Router)             │
│  RSC + Client Components · shadcn · TanStack Query · Zustand     │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / SSE streaming
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Next.js Edge + Node Runtimes                     │
│                                                                   │
│  Route Handlers  ─►  Supabase Auth middleware  ─►  Rate Limit    │
│         │                                                         │
│         ▼                                                         │
│  Application Services (server-only)                               │
│   SessionService · QuestionService · FeedbackService              │
│   SummaryService · ProgressService · RecommendationService        │
│         │                                                         │
│  ┌──────┴──────────┐   ┌──────────────────────┐   ┌────────────┐ │
│  │ Persistence     │   │ AI Orchestration     │   │ Analytics  │ │
│  │ Prisma ─► Supa  │   │ Prompts · Validate   │   │ PostHog    │ │
│  └─────────────────┘   │ Retry · Model router │   └────────────┘ │
│                        │ Cost telemetry       │                  │
│                        └──────┬───────────────┘                  │
└───────────────────────────────┼──────────────────────────────────┘
                                ▼
                       OpenAI / Anthropic
                       (Realtime API post-MVP)
```

---

## 4. Folder Structure

```
src/
  app/
    (marketing)/page.tsx              # landing
    (app)/                            # auth-gated layout
      onboarding/page.tsx
      practice/
        new/page.tsx                  # topic selection
        [sessionId]/page.tsx          # interview screen
      dashboard/page.tsx
      history/
        page.tsx
        [sessionId]/page.tsx
      settings/page.tsx
    api/
      sessions/                       # PRD §14 REST endpoints
        route.ts                      # POST create
        [id]/
          route.ts                    # GET, DELETE
          questions/generate/route.ts # SSE
          complete/route.ts
      answers/
        route.ts                      # POST submit
        [id]/feedback/generate/route.ts  # SSE
      webhooks/supabase/route.ts      # user lifecycle
  features/                           # vertical slices, <200 LoC files
    interview/
      server/                         # 'server-only' services
      hooks/                          # useInterviewSession, useStreamedFeedback
      components/
      store.ts                        # Zustand state machine
      schemas.ts                      # Zod (API + AI)
      types.ts
    feedback/
    dashboard/
    onboarding/
    auth/
  lib/
    ai/
      client.ts                       # AI SDK provider config
      orchestrator.ts                 # retry · validate · fallback
      model-router.ts                 # cheap vs deep model tiering
      cost-meter.ts                   # token accounting → AICall table
      prompts/                        # one file per PRD §9 prompt
        question.ts
        followup.ts
        evaluate.ts
        summary.ts
    db/
      client.ts                       # Prisma singleton
      seed.ts                         # question bank seeder
    auth/
      supabase-server.ts              # createServerClient
      supabase-client.ts              # createBrowserClient
      session.ts                      # getCurrentUser
    rate-limit/
      upstash.ts
    analytics/
      posthog-server.ts
      posthog-client.ts
    utils/
  components/ui/                      # shadcn primitives
prisma/
  schema.prisma
  migrations/
  seed/
    questions/                        # JSON seed files by topic
```

Rule: features import from `lib/*`. Never `lib/*` from features.

---

## 5. AI Orchestration Layer

Architectural backbone. Every AI call routes through one orchestrator.

```ts
// lib/ai/orchestrator.ts
export type AITask =
  | { type: 'generate_question'; input: QuestionInput }
  | { type: 'generate_followup'; input: FollowupInput }
  | { type: 'evaluate_answer';   input: EvaluateInput }
  | { type: 'generate_summary';  input: SummaryInput };

export interface Orchestrator {
  run<T extends AITask>(task: T): Promise<TaskResult<T>>;
  stream<T extends AITask>(task: T): AsyncIterable<Chunk<T>>;
}
```

### Responsibilities

| # | Concern | Implementation |
|---|---|---|
| 1 | Prompt registry | One file per `lib/ai/prompts/*`. Versioned. Pure functions returning string. |
| 2 | Structured output | Vercel AI SDK `generateObject` + Zod schema per task. Invalid JSON → retry. |
| 3 | Retry + fallback | 1 retry on schema fail; then fallback message persisted as `feedbackGenerationFailed`. |
| 4 | Model tiering | `model-router.ts`: cheap (Haiku 4.5) for question gen, premium (Sonnet 4.6) for evaluation. |
| 5 | Cost telemetry | Every call writes to `AICall` table: model, prompt+completion tokens, USD cost. |
| 6 | Save-before-call | Caller persists `UserAnswer` row before invoking `evaluate_answer`. Orchestrator never owns DB writes. |
| 7 | Streaming | `stream()` returns SSE-compatible chunks; route handler pipes to client. |
| 8 | Sanitization | Strip prompt-injection patterns from user input. Cap input length per task. |

### Why one orchestrator

- One place to swap providers (OpenAI ↔ Anthropic).
- One place to add metrics, tracing, caching.
- One place to enforce token budgets.
- Route handlers stay thin (auth check → call orchestrator → stream).

---

## 6. Data Model (Prisma)

Extends [PRD §13](../PRD.md). Additions in **bold**.

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  image             String?
  level             Level
  targetRole        String?
  targetCompanyType String?
  preferredTopics   String[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  sessions          InterviewSession[]
  // Supabase auth user id (UUID) maps to id via webhook
}

model InterviewSession {
  id           String         @id @default(cuid())
  userId       String
  user         User           @relation(fields: [userId], references: [id])
  mode         SessionMode
  topics       String[]
  difficulty   Difficulty
  status       SessionStatus
  overallScore Float?
  startedAt    DateTime       @default(now())
  completedAt  DateTime?
  questions    InterviewQuestion[]
  summary      SessionSummary?
  // resumeContext String?       @db.Text  // post-MVP
  @@index([userId, startedAt])
}

model InterviewQuestion {
  id              String       @id @default(cuid())
  sessionId       String
  session         InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  topic           String
  subtopic        String?
  difficulty      Difficulty
  type            QuestionType
  question        String
  expectedPoints  String[]
  order           Int
  seedQuestionId  String?      // points to SeedQuestion if hybrid
  answer          UserAnswer?
  @@index([sessionId, order])
}

model UserAnswer {
  id              String   @id @default(cuid())
  questionId      String   @unique
  question        InterviewQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  sessionId       String
  userId          String
  answer          String   @db.Text
  followUpAnswer  String?  @db.Text
  feedback        AnswerFeedback?
  createdAt       DateTime @default(now())
}

model AnswerFeedback {
  id                       String   @id @default(cuid())
  answerId                 String   @unique
  answer                   UserAnswer @relation(fields: [answerId], references: [id], onDelete: Cascade)
  overallScore             Float
  scoreCorrectness         Int
  scoreCompleteness        Int
  scoreClarity             Int
  scoreDepth               Int
  scoreTradeoffThinking    Int
  scoreCommunication       Int
  whatWentWell             String[]
  whatWasMissing           String[]
  technicalCorrections     String[]
  improvementSuggestions   String[]
  betterAnswer             String   @db.Text
  seniorLevelAddition      String?  @db.Text
  recommendedNextPractice  String[]
  // Telemetry
  modelUsed                String
  tokensUsed               Int
  createdAt                DateTime @default(now())
}

model SessionSummary {
  id                String   @id @default(cuid())
  sessionId         String   @unique
  session           InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  overallScore      Float
  strongAreas       String[]
  weakAreas         String[]
  repeatedMistakes  String[]
  recommendedTopics String[]
  actionItems       String[]
  createdAt         DateTime @default(now())
}

// PRD §7.10 hybrid seed bank.
// Source: extracted from `resources/*.html` (user-authored prep content),
// batch-translated VN→EN during seeding. EN-only at MVP.
model SeedQuestion {
  id             String       @id
  topic          String
  subtopic       String?
  difficulty     Difficulty
  type           QuestionType
  question       String
  expectedPoints String[]
  followUps      String[]
  rubric         Json
  tags           String[]     // e.g. ["web3"] — filters niche content
  createdAt      DateTime     @default(now())
  @@index([topic, difficulty])
}

// Cost & observability
model AICall {
  id               String   @id @default(cuid())
  userId           String?
  sessionId        String?
  task             String   // 'generate_question' | 'evaluate_answer' | ...
  model            String
  promptTokens     Int
  completionTokens Int
  costUsd          Decimal  @db.Decimal(10, 6)
  latencyMs        Int
  succeeded        Boolean
  errorReason      String?
  createdAt        DateTime @default(now())
  @@index([userId, createdAt])
  @@index([task, createdAt])
}

enum Level         { junior mid senior }
enum Difficulty    { junior mid senior }
enum SessionMode   { quick standard deep_coaching }
enum SessionStatus { in_progress completed ended_early }
enum QuestionType  { conceptual debugging system_design behavioral tradeoff }
```

---

## 7. Session State Machine

```
        ┌──────────┐
        │ created  │
        └────┬─────┘
             │ POST /api/sessions/:id/questions/generate
             ▼
   ┌─────────────────────┐         ┌────────────────────┐
   │ question_active     │◄────────│ next question      │
   └────┬────────────────┘         └──────────┬─────────┘
        │ POST /api/answers                   │
        ▼                                     │
   ┌─────────────────┐                        │
   │ answer_submitted│                        │
   └────┬────────────┘                        │
        │ POST .../feedback/generate (SSE)    │
        ▼                                     │
   ┌─────────────────────┐                    │
   │ feedback_generated  │────────────────────┘
   └────┬────────────────┘
        │ POST /api/sessions/:id/complete
        ▼
   ┌──────────────┐   or   ┌──────────────┐
   │  completed   │        │ ended_early  │
   └──────────────┘        └──────────────┘
```

- Server is source of truth via `InterviewSession.status` + question order.
- Zustand mirrors UI state only; refreshes from server on mount.
- Edge case "user closes browser" (PRD §19) → server state intact → resume on next visit.

---

## 8. Auth & Authorization (Supabase + Prisma)

**Two clients:**
- `lib/auth/supabase-server.ts` — `createServerClient` from `@supabase/ssr`, reads cookies. Used in Server Components, Route Handlers, Server Actions.
- `lib/auth/supabase-client.ts` — `createBrowserClient`. Used in Client Components for sign-in/sign-out UI.

**Identity bridge:** Supabase Auth owns the user (UUID). On signup, a webhook (or Server Action on first login) creates a `User` row in Prisma keyed by the same id. This keeps Prisma joins type-safe without RLS complexity.

**Authorization:**
- App-layer: every Route Handler calls `getCurrentUser()`. Service functions take `userId` explicitly and filter all queries.
- RLS: deferred to post-MVP defense-in-depth. Direct DB access uses service role connection via Prisma; RLS would require JWT-based connection per request.

**Guest mode (PRD §10.1):**
- Unauthenticated users get one anonymous session stored in `sessionStorage`.
- On completing, prompt to sign up to save progress.
- Sign-up converts the anonymous session via `POST /api/sessions/import` with the local payload.

---

## 9. API Contract

Matches PRD §14, formalized:

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/sessions` | required | `{mode, topics, difficulty}` | `{sessionId, status}` |
| GET | `/api/sessions/:id` | required | — | session + questions + feedback |
| DELETE | `/api/sessions/:id` | required | — | `204` |
| POST | `/api/sessions/:id/questions/generate` | required | — | **SSE** stream of question |
| POST | `/api/answers` | required | `{questionId, answer, followUpAnswer?}` | `{answerId}` |
| POST | `/api/answers/:id/feedback/generate` | required | — | **SSE** stream of feedback |
| POST | `/api/sessions/:id/complete` | required | — | `{summaryId, overallScore, ...}` |
| GET | `/api/dashboard` | required | — | progress aggregates |

All SSE endpoints use the AI SDK's `toDataStreamResponse()`.

---

## 10. Security

- API keys server-only. No `NEXT_PUBLIC_OPENAI_*`.
- Rate limit at middleware: 30 AI calls per hour per `userId`, 5 per IP for guests.
- Input sanitization in orchestrator (strip `<|...|>`, ignore-instructions patterns, cap to 4k chars).
- Output validation via Zod — every AI response parsed; invalid → retry once → fallback.
- CSP headers set in `next.config.ts`.
- Webhooks (Supabase) verify HMAC signature.

---

## 11. Observability & Cost

- **Cost dashboard** built on `AICall` table — query daily spend per task type, per model, per user.
- **PostHog** captures PRD §20 events from client + server (autocapture off, explicit `capture()`).
- **Vercel Analytics** for Core Web Vitals (PRD §11.1).
- **Sentry** post-MVP for error tracing.

---

## 12. Performance Targets (PRD §11.1)

| Metric | Target |
|---|---|
| Landing LCP | < 1.5s |
| Dashboard load | < 2s |
| First AI token | < 2s |
| Full feedback stream | < 15s |

Streaming is mandatory for question generation and feedback. Submit → server returns `answerId` immediately, then UI subscribes to SSE for feedback.

---

## 13. Post-MVP Architecture Hooks

| Phase | Addition | How it slots in |
|---|---|---|
| Voice (Phase 2) | OpenAI Realtime API | 5th orchestrator task type; UI swaps `<TextInput>` for `<RealtimeMic>`; session machine unchanged |
| Resume context | `UserDocument` + pgvector | Upload to Supabase Storage; embed; inject top-K chunks into question prompt |
| Company-specific | Company profile table | Adds `companyId` to session creation; prompt template variant |
| System design canvas | tldraw/excalidraw | `UserAnswer.canvasState Json?`; orchestrator reads canvas + transcript |

---

## 14. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=                   # for Prisma direct connection
SUPABASE_WEBHOOK_SECRET=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

NEXT_PUBLIC_APP_URL=
```

---

## 15. Definition of Architecture Ready

- [ ] Supabase project created (auth + db + storage enabled).
- [ ] Prisma schema migrated to Supabase.
- [ ] Vercel project linked; env vars set.
- [ ] AI SDK provider configured; orchestrator skeleton compiles.
- [ ] Zod schemas defined for all 4 AI tasks.
- [ ] Rate-limit middleware wired.
- [ ] PostHog initialized client + server.
- [ ] Seed question script runs and populates ~50 questions across topics.

---

## Open Questions

1. Anonymous-session import flow — accept full session JSON or only topic preferences?
2. AI provider strategy — start with OpenAI only and add Anthropic later, or dual from day 1?
3. PostHog cloud vs self-hosted for portfolio piece (cost vs polish trade-off)?
4. Should we ship a small public-read demo session for unauthenticated landing-page preview?
