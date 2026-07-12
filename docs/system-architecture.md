# System Architecture — Frontend Coach

**Status:** v3 (current)
**Last updated:** 2026-07-02

---

## 1. Overview

Frontend Coach is a Next.js 16 App Router application that helps developers prepare for frontend engineering interviews through four complementary practice modes:

1. **AI Mock Interviews** — adaptive question generation, follow-up probing, rubric-grounded scoring, mock exam mode
2. **Build & Critique** — React component challenges graded by axe-core accessibility audit + AI critique
3. **Question Bank + Study Plan** — 350+ curated questions with spaced-repetition scheduling and daily review
4. **Coding Challenges** — Monaco editor + sandboxed JS execution + AI code review

The entire app deploys as a single Vercel unit backed by Supabase Postgres.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC streaming, SSE built-in, Turbopack |
| Language | TypeScript (strict) | Zod schemas shared between API and AI contracts |
| Styling | Tailwind v4 + shadcn/ui | CSS variables for light/dark theming |
| AI SDK | Vercel AI SDK v6 | `generateObject` (Zod-validated) + `streamText` |
| LLM Providers | OpenAI, Anthropic, Groq, DeepSeek | Tier-routed via env vars |
| ORM | Prisma 7 | Supabase Postgres with pg adapter |
| Auth | Supabase Auth (`@supabase/ssr`) | Email + Google OAuth; SSR-safe cookie session |
| Rate Limiting | Upstash Redis | Per-user sliding window |
| Payments | Polar | Subscription webhooks |
| Client Cache | TanStack Query v5 | Client-side query cache + optimistic updates |
| Client State | Zustand | Interview session store |
| Code Execution | Node.js `vm` module | Sandboxed JS harness for function challenges |
| Component Sandbox | `<iframe>` srcdoc + Babel CDN | Client-side React render + axe-core a11y audit |
| Code Editor | Monaco (`@monaco-editor/react`) | Lazy-loaded, SSR-disabled |
| Spaced Repetition | SM-2 algorithm | Per-(user, topic) `ReviewItem` rows |
| Hosting | Vercel | Streaming responses, Node runtime |

---

## 3. High-Level Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        UI["React / RSC\nshadcn · TanStack Query · Zustand"]
        Monaco["Monaco Editor\n(lazy, SSR=false)"]
        Iframe["Component Sandbox\niframe srcdoc\nBabel + React + axe-core"]
    end

    subgraph Vercel["Vercel (Node.js Runtime)"]
        MW["Auth Middleware\nSupabase SSR"]
        RSC["Server Components\n(data fetching)"]
        API["Route Handlers\n/api/**"]
        Orch["AI Orchestrator\nmodel-router · cost-meter"]
        VM["JS Sandbox\nNode vm module"]
    end

    subgraph External["External Services"]
        Supabase["Supabase\nPostgres + Auth + Storage"]
        LLM["LLM Providers\nOpenAI · Anthropic\nGroq · DeepSeek"]
        Upstash["Upstash Redis\nRate limiting"]
        Polar["Polar\nSubscriptions"]
    end

    UI -- "HTTPS / SSE" --> MW
    MW --> RSC
    MW --> API
    API --> Orch
    API --> VM
    Orch --> LLM
    RSC --> Supabase
    API --> Supabase
    API --> Upstash
    Polar -- "Webhook POST" --> API
    Supabase -- "Auth webhook" --> API
    Iframe -- "signals POST" --> API
```

---

## 4. Application Routing

Three Next.js route groups plus root-level public pages:

```mermaid
graph LR
    subgraph Reader["(reader) — public, no auth"]
        Questions["/questions\n/questions/[topic]\n/questions/[slug]"]
        Resources["/resources/**\nhandbooks · cheatsheets · glossary"]
    end

    subgraph Marketing["(marketing) — public"]
        Landing["/ — Landing page"]
        Demo["/demo"]
        Legal["/privacy · /terms"]
    end

    subgraph Root["root — public"]
        SignIn["/sign-in"]
        Share["/share/[token]"]
    end

    subgraph AuthGate["Auth Gate — (app)/layout.tsx"]
        Check{"requireUser()"}
        OBCheck{"targetRole set?"}
    end

    subgraph App["(app) — auth + onboarding gated"]
        Dashboard["/dashboard"]
        Practice["/practice/new\n/practice/[sessionId]\n/practice/[sessionId]/complete"]
        Review["/review — daily spaced repetition"]
        QB["/question-bank · /question-bank/[id]"]
        Coding["/coding-challenges · /coding-challenges/[id]"]
        StudyPlan["/study-plan"]
        History["/history · /history/[sessionId]"]
        CV["/cv-review"]
        Settings["/settings"]
        Upgrade["/upgrade"]
        Onboarding["/onboarding"]
    end

    Check -- "null" --> SignIn
    Check -- "user" --> OBCheck
    OBCheck -- "no targetRole" --> Onboarding
    OBCheck -- "onboarded" --> Dashboard
    OBCheck -- "onboarded" --> Practice
    OBCheck -- "onboarded" --> Review
    OBCheck -- "onboarded" --> QB
    OBCheck -- "onboarded" --> Coding
    OBCheck -- "onboarded" --> StudyPlan
    OBCheck -- "onboarded" --> History
    OBCheck -- "onboarded" --> CV
    OBCheck -- "onboarded" --> Settings
    OBCheck -- "onboarded" --> Upgrade
```

---

## 5. Data Model

```mermaid
erDiagram
    User {
        string id PK
        string email
        boolean isPro
        boolean hasLifetimePlan
        string polarCustomerId
        json cvData
        datetime targetInterviewDate
        int dailyGoal
        int currentStreak
        int longestStreak
        datetime lastActiveDate
    }

    InterviewSession {
        string id PK
        string userId FK
        string mode "quick|standard|deep_coaching|mock"
        string[] topics
        string difficulty
        string status
        float overallScore
        string shareToken "nullable, unique UUID"
    }

    InterviewQuestion {
        string id PK
        string sessionId FK
        string topic
        string type
        string difficulty
        int order
    }

    UserAnswer {
        string id PK
        string questionId FK
        string answer
        string followUpAnswer
    }

    AnswerFeedback {
        string id PK
        string answerId FK
        float overallScore
        int scoreCorrectness
        int scoreCompleteness
        int scoreClarity
        int scoreDepth
        int scoreTradeoffThinking
        int scoreCommunication
        string betterAnswer
    }

    SessionSummary {
        string id PK
        string sessionId FK
        float overallScore
        string[] strongAreas
        string[] weakAreas
        string[] repeatedMistakes
        string[] recommendedTopics
        string[] actionItems
    }

    ReviewItem {
        string id PK
        string userId FK
        string topic
        float easeFactor "SM-2: 1.3..2.5"
        int intervalDays
        int repetitions
        datetime dueAt
        float lastScore
        datetime lastReviewedAt
    }

    CodingChallenge {
        string id PK
        string title
        string difficulty
        string topic
        string kind "function|component"
        string starterCode
        json testCases
        string solution
    }

    CodingSubmission {
        string id PK
        string userId FK
        string challengeId FK
        string code
        string language "javascript|jsx"
        string status
        json testResults "fn: per-case pass/fail | component: axe signals"
        string aiReview
    }

    TargetJob {
        string id PK
        string userId FK
        string label
        string rawJd
        json jdContext "role · company · stack · signals"
    }

    SeedQuestion {
        string id PK
        string topic
        string difficulty
        string type
        string slug "stable URL key"
        string childExplanation
        string detailedExplanation
        string diagramSvg
        string quiz
    }

    StudyPlan {
        string id PK
        string userId FK
        string[] topics
        string level
        int prepWeeks
    }

    StudyPlanProgress {
        string id PK
        string planId FK
        string seedQuestionId
        int repetitions
        float easeFactor
        datetime nextReviewAt
    }

    PromoCode {
        string id PK
        string code
        int durationDays
        int maxUses
    }

    PromoRedemption {
        string id PK
        string promoCodeId FK
        string userId FK
        datetime proExpiresAt
    }

    AICall {
        string id PK
        string userId FK
        string task
        string model
        int promptTokens
        int completionTokens
        decimal costUsd
    }

    User ||--o{ InterviewSession : "has"
    InterviewSession ||--o{ InterviewQuestion : "contains"
    InterviewSession ||--o| SessionSummary : "summarised as"
    InterviewSession ||--o{ TargetJob : "targeted at"
    InterviewQuestion ||--o| UserAnswer : "answered by"
    UserAnswer ||--o| AnswerFeedback : "evaluated as"
    User ||--o{ ReviewItem : "scheduled for"
    User ||--o{ CodingSubmission : "submits"
    CodingChallenge ||--o{ CodingSubmission : "receives"
    User ||--o| StudyPlan : "has"
    StudyPlan ||--o{ StudyPlanProgress : "tracks"
    PromoCode ||--o{ PromoRedemption : "redeemed via"
    User ||--o{ PromoRedemption : "redeems"
    User ||--o{ AICall : "triggers"
```

---

## 6. AI Orchestration Layer

Every LLM call routes through `src/lib/ai/orchestrator.ts`. Route handlers stay thin — authenticate, validate, delegate.

```mermaid
flowchart TD
    RH["Route Handler\nauth · rate-limit · zod"]
    Orch["runAITask / streamCodeReview\norchestrator.ts"]
    MR["routeModel()\nmodel-router.ts"]
    Prompt["buildPrompt()\nprompts/*.ts"]
    AISDK["Vercel AI SDK\ngenerateObject / streamText"]
    Validate["Zod schema\nvalidation"]
    Retry["Retry max 2\non schema error"]
    CM["recordAICall()\ncost-meter.ts"]
    DB["Prisma → Supabase"]

    RH --> Orch
    Orch --> MR
    Orch --> Prompt
    MR -- "provider + model" --> AISDK
    Prompt -- "system + user" --> AISDK
    AISDK --> Validate
    Validate -- "fail" --> Retry
    Retry --> AISDK
    Validate -- "pass" --> CM
    CM --> DB
    Orch -- "result" --> RH
```

### Model Tiering

| Tier | Tasks | Typical Model |
|---|---|---|
| `cheap` | `generate_question`, `generate_followup`, `extract_jd` | DeepSeek Chat / Haiku |
| `smart` | `evaluate_answer`, `generate_summary`, `review_code`, `review_component` | DeepSeek Chat / Sonnet |

Provider selected via `LLM_SMART_PROVIDER` / `LLM_CHEAP_PROVIDER` → `LLM_PROVIDER` → `deepseek`.

### AI Task Registry

| Task | Input | Output | Tier |
|---|---|---|---|
| `generate_question` | topic, difficulty, CV/JD context | question + expectedPoints | cheap |
| `generate_followup` | question + answer | follow-up question | cheap |
| `evaluate_answer` | question + answer + rubric | 6-dimension scores + feedback | smart |
| `generate_summary` | all answers in session | overall score + action items | smart |
| `extract_jd` | raw job description | role, stack, signals | cheap |
| `review_code` | JS challenge + user code | streamed markdown | smart |
| `review_component` | JSX code + axe signals | streamed accessibility critique | smart |

CV parsing and review use separate privacy-conscious flows excluded from `AICall` telemetry.

---

## 7. Interview Session Lifecycle

### Standard / Deep Coaching Mode

```mermaid
sequenceDiagram
    participant U as User
    participant API as Route Handler
    participant Orch as Orchestrator
    participant LLM as LLM Provider
    participant DB as Supabase

    U->>API: POST /api/sessions (config)
    API->>DB: INSERT InterviewSession
    API-->>U: sessionId

    loop Per question (max 3–5)
        U->>API: POST /api/sessions/[id]/questions/generate (SSE)
        API->>Orch: generate_question
        Orch->>LLM: streamText cheap tier
        API->>DB: INSERT InterviewQuestion
        API-->>U: SSE question text

        U->>API: POST /api/answers
        API->>DB: INSERT UserAnswer

        U->>API: POST /api/answers/[id]/feedback/generate (SSE)
        API->>Orch: evaluate_answer
        Orch->>LLM: generateObject smart tier
        API->>DB: INSERT AnswerFeedback
        API-->>U: SSE streamed feedback
    end

    U->>API: POST /api/sessions/[id]/complete
    API->>Orch: generate_summary
    API->>DB: INSERT SessionSummary
    API-->>U: summary + scores
```

### Mock Exam Mode (no live feedback)

```mermaid
sequenceDiagram
    participant U as User
    participant API as Route Handler
    participant Orch as Orchestrator
    participant DB as Supabase

    Note over U,DB: Same question generation loop,<br/>but feedback UI is suppressed client-side

    U->>API: POST /api/sessions/[id]/complete
    loop Per unevaluated answer (batch)
        API->>Orch: evaluate_answer (smart tier)
        API->>DB: INSERT AnswerFeedback
    end
    API->>Orch: generate_summary
    API->>DB: INSERT SessionSummary
    API-->>U: summary + full per-question debrief
```

---

## 8. Coding Challenges Feature

Two challenge kinds with distinct execution paths.

### Function Challenges (`kind = "function"`)

```mermaid
sequenceDiagram
    participant U as User
    participant CW as ChallengeWorkspace
    participant API as /submit route
    participant VM as Node.js vm
    participant DB as Supabase

    U->>CW: clicks Run & Submit
    CW->>API: POST { code }
    API->>DB: fetch CodingChallenge (testCases incl. hidden)
    API->>VM: buildTestHarness → vm.runInNewContext
    Note over VM: No require / process / fetch / fs
    VM-->>API: test results
    API->>DB: INSERT CodingSubmission
    API-->>CW: status · testResults · passedCount
```

### Component Challenges (`kind = "component"`)

```mermaid
sequenceDiagram
    participant U as User
    participant CW as ChallengeWorkspace
    participant IFrame as iframe sandbox
    participant API as /submit-component route
    participant LLM as LLM (streamed)
    participant DB as Supabase

    U->>CW: edits JSX in Monaco
    CW->>IFrame: postMessage (srcdoc rebuild)
    Note over IFrame: Babel transpile → React render<br/>axe-core audit → commit counting
    IFrame-->>CW: signals { status, violations, checks, render }

    U->>CW: clicks Submit
    CW->>API: POST { code, signals }
    API->>API: grade: ok + no serious/critical + checks pass
    API->>DB: INSERT CodingSubmission (language=jsx)
    API-->>CW: submissionId · status

    opt Pro user requests AI critique
        CW->>API: GET /submissions/[id]/ai-review (SSE)
        API->>LLM: streamText — code + axe signals
        API-->>CW: streamed accessibility critique
    end
```

### Security Boundaries

| Concern | Mechanism |
|---|---|
| Authentication | `requireUser()` — 401 if no valid session |
| Rate limiting | `guardGeneralLimit()` — Upstash sliding window per user |
| JS sandbox | `vm.runInNewContext` — no `require`, `process`, `fetch`, `fs` |
| Execution timeout | `vm` `timeout` (sync) + `Promise.race` wall-clock (async) |
| Component sandbox | sandboxed `<iframe>` srcdoc — no access to parent origin |
| axe signals trust | Signals are user's own measurements — faking them harms no one but the submitter |
| Hidden test data | `solution` and hidden `expected` values never sent to client |
| AI review gate | Pro-only + `status === 'passed'` only |
| AI review cache | Persisted to `CodingSubmission.aiReview` — no repeat LLM calls |

---

## 9. Spaced Repetition (Daily Review)

Every scored interview answer advances the SM-2 state for its topic.

```mermaid
flowchart LR
    Answer["UserAnswer graded\n(overallScore 1–5)"]
    SM2["sm2.ts\nadvanceReviewItem(item, score)"]
    DB["ReviewItem upsert\neaseFactor · intervalDays · dueAt"]
    Queue["review-queue-service\nfindDueItems(userId, today)"]
    ReviewPage["/review\nserves due topics"]
    Streak["streak-utils.ts\nupdateStreak(user, today)"]

    Answer --> SM2
    SM2 --> DB
    DB --> Queue
    Queue --> ReviewPage
    Answer --> Streak
    Streak --> DB2["User.currentStreak\nlongestStreak · lastActiveDate"]
```

`ReviewItem` is keyed on `(userId, topic)` with a unique constraint. `dueAt` starts at `now()` and advances by `intervalDays` after each successful review. `easeFactor` is clamped between 1.3 and 2.5.

---

## 10. Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant MW as Next.js Middleware
    participant Supa as Supabase Auth
    participant DB as Prisma

    B->>MW: any request
    MW->>MW: auth.getClaims() — local JWT verify (JWKS cached)
    alt Expired token / legacy HS256
        MW->>Supa: refresh / validate over network
    end
    alt No valid session
        MW-->>B: redirect /sign-in
    else Valid session
        MW->>DB: upsert User row (first-visit provisioning, 30s unstable_cache)
        DB-->>MW: DbUser
        MW-->>B: serve page
    end

    Note over MW,DB: getCurrentUser() is memoized via React cache()<br/>— single DB hit per server request tree.<br/>getClaims() avoids a Supabase Auth round-trip per request.
```

---

## 11. Share Result Flow

Session results can be shared via a public URL that requires no authentication.

```mermaid
sequenceDiagram
    participant U as User
    participant Button as ShareSessionButton
    participant API as /api/sessions/[id]/share-token
    participant DB as Supabase
    participant R as Recipient

    U->>Button: clicks Share result
    Button->>API: POST (auth-required)
    API->>DB: read InterviewSession.shareToken
    alt token exists
        DB-->>API: existing UUID
    else first share
        API->>DB: UPDATE shareToken = crypto.randomUUID()
    end
    API-->>Button: { token }
    Button->>Button: build /share/{token}
    Button->>Button: navigator.share() or clipboard copy

    R->>App: GET /share/{token}
    Note over App: Outside (app) route group — no auth guard
    App->>DB: getPublicSessionByToken(token)
    App-->>R: score · strong/weak areas · CTA
```

---

## 12. Subscription & Billing

```mermaid
flowchart LR
    U["User"] -->|"Upgrade click"| CO["POST /api/checkout\ncreate Polar checkout"]
    CO -->|"redirect"| Polar["Polar Checkout"]
    Polar -->|"payment complete"| WH["POST /api/webhooks/polar\nverify signature"]
    WH -->|"subscription.created"| DB["prisma.user.update\nisPro=true · proSince"]
    WH -->|"subscription.canceled"| DB2["prisma.user.update\nisPro=false"]

    Promo["Promo code"] -->|"POST /api/checkout/redeem"| RD["INSERT PromoRedemption\nisPro=true · proExpiresAt"]
```

---

## 13. Feature Dependency Map

```mermaid
graph LR
    Auth["Supabase Auth"] --> All["All features"]

    All --> Interview["AI Mock Interviews\nquick · standard · deep_coaching · mock"]
    All --> BC["Build & Critique\ncomponent challenges + axe-core + AI critique"]
    All --> QB["Question Bank\ncurated questions + ELI5 + diagrams"]
    All --> SP["Study Plan\nSM-2 spaced repetition"]
    All --> DR["Daily Review\n/review — SM-2 due topics"]
    All --> CC["Coding Challenges\nMonaco + vm sandbox"]
    All --> CV["CV Review\nupload → parse → AI feedback"]
    All --> Dashboard["Dashboard\nreadiness · trend · weak areas"]

    Interview --> Dashboard
    Interview --> DR
    QB --> SP
    CC --> Dashboard
    BC --> Dashboard
    CV --> Interview

    subgraph Pro["Pro features only"]
        WeakAreas["Weak Area Coaching"]
        JobTarget["Job Targeting"]
        AIReview["AI Code Review\n(function + component)"]
        CVGround["CV-grounded questions"]
        MockMode["Mock Exam Mode"]
    end

    Dashboard --- WeakAreas
    Interview --- JobTarget
    Interview --- MockMode
    CC --- AIReview
    BC --- AIReview
    Interview --- CVGround
```

---

## 14. Public SEO Layer

The `(reader)` route group provides fully server-rendered public pages for organic acquisition. No auth required.

| Route | Purpose |
|---|---|
| `/questions` | All-topics hub — grid of topic cards with question counts |
| `/questions/[topic]` | Per-topic hub — questions list with difficulty filter |
| `/questions/[slug]` | Question detail — question text, ELI5, diagram, quiz (gated behind sign-up) |
| `/resources/**` | Handbooks (FSD, JS core, React, Optimization), cheatsheets, glossary |

Key constraints:
- `study-public-service.ts` never selects `rubric`, `expectedPoints`, or `followUps` — the answer key cannot reach anonymous HTML
- `SeedQuestion.slug` is assigned once on seed import and never regenerated (URL permanence)
- OG image at `/api/og/question?id=...` — used for social sharing and Twitter card
- `src/app/sitemap.ts` includes all question slugs; `robots.ts` allows crawling of `(reader)` paths

---

## 15. Folder Structure

```
src/
├── app/
│   ├── (marketing)/              # public: landing, demo, privacy, terms
│   ├── (reader)/                 # public SEO: question bank + resources
│   │   ├── questions/            # hub, [topic], [slug] detail
│   │   └── resources/            # handbooks + cheatsheets + glossary
│   ├── (app)/                    # auth + onboarding gated
│   │   ├── layout.tsx            # sidebar + header + auth/onboarding guard
│   │   ├── dashboard/
│   │   ├── practice/             # [new] setup; [sessionId] interview + complete
│   │   ├── review/               # daily spaced repetition
│   │   ├── coding-challenges/    # list + [id] workspace (fn + component)
│   │   ├── question-bank/
│   │   ├── study-plan/
│   │   ├── history/
│   │   ├── cv-review/
│   │   └── settings/ upgrade/
│   ├── share/[token]/            # public share page (no auth, no route group)
│   ├── sign-in/
│   └── api/
│       ├── sessions/             # CRUD + question SSE + complete + share-token
│       ├── answers/              # submit + feedback SSE + followup SSE
│       ├── coding-challenges/    # list · single · submit · submit-component
│       │                         # solution · ai-review (SSE)
│       ├── dashboard/            # aggregated stats
│       ├── study-plan/           # SM-2 progress + tailor-to-job
│       ├── target-jobs/          # Pro JD targeting CRUD
│       ├── transcribe/           # browser audio → text (voice input)
│       ├── cv/                   # upload · parse · review
│       ├── checkout/             # Polar billing
│       ├── revalidate/           # cache busting (seed script webhook)
│       ├── og/                   # OG image generators (session + question)
│       └── webhooks/polar/
│
├── features/                     # vertical slices, max ~200 LoC per file
│   ├── interview/                # session UI, hooks, Zustand store, AI schemas
│   ├── feedback/                 # feedback card, streaming hook, share button
│   │   └── server/               # summary-service, share-service
│   ├── coding-challenges/        # workspace, editor, test results, hints, solution
│   │   └── component-sandbox/    # iframe srcdoc builder, axe signals, a11y panel
│   ├── review/                   # SM-2 algorithm, streak utils, review queue
│   ├── dashboard/                # charts, readiness card, recommendations
│   ├── study/                    # question card, filter bar, prose renderer
│   ├── study-plan/               # plan management
│   ├── target-jobs/              # job description management
│   ├── cv-review/                # CV upload + review card
│   ├── settings/                 # profile, preferences, interview date
│   ├── subscription/             # promo code, upgrade prompts
│   └── app/                      # sidebar nav, app header
│
├── lib/                          # shared, feature-agnostic utilities
│   ├── ai/
│   │   ├── orchestrator.ts       # runAITask · streamCodeReview
│   │   ├── model-router.ts       # cheap vs smart tiering
│   │   ├── cost-meter.ts         # AICall telemetry
│   │   └── prompts/              # one file per AI task
│   ├── coding-challenges/
│   │   ├── local-js-executor.ts  # vm sandbox with async/await support
│   │   ├── test-harness-builder.ts
│   │   ├── submission-validator.ts
│   │   └── challenge-projection.ts
│   ├── auth/
│   │   ├── session.ts            # getCurrentUser · requireUser
│   │   └── supabase-*.ts         # SSR/browser clients
│   ├── db/client.ts              # Prisma singleton with pg adapter
│   ├── rate-limit/               # Upstash guard helpers
│   ├── seo/                      # site-url · slugify-question · structured-data
│   └── subscription/             # isPro checks
│
├── components/ui/                # shadcn primitives
└── prisma/
    ├── schema.prisma             # 16 models
    └── seeds/
        ├── seed.ts               # SeedQuestion seeder
        └── coding-challenges-seed.ts
```

**Import rule:** `features/*` may import from `lib/*` and `components/*`. `lib/*` must never import from `features/*`.

---

## 16. Key Design Decisions

| Decision | Rationale |
|---|---|
| Single Vercel deploy | No microservices overhead for MVP scale |
| `vm.runInNewContext` instead of Piston API | Piston went whitelist-only Feb 2026; local sandbox is faster, zero cost, no external dependency |
| Async IIFE harness for code execution | Lets test cases `await` Promise-returning solutions without worker threads |
| iframe srcdoc for component sandbox | Isolates user JSX from parent origin; Babel CDN transpiles JSX client-side with no server round-trip |
| axe-core runs client-side | Server can't render React DOM; client signals are self-reported — faking harms only the submitter |
| Mock mode defers all feedback | Simulates a real exam environment; batch-generates at `/complete` so the payoff is revealed together |
| `InterviewSession.shareToken` lazy-generated | UUID created on first share click, not at session completion — avoids DB writes for sessions never shared |
| `/share/[token]` at root (not in `(app)`) | Outside the auth-guarded route group; accessible to anyone with the link |
| AI review cached per submission | Persists to `CodingSubmission.aiReview`; no redundant LLM calls on revisits |
| `getCurrentUser()` uses React `cache()` | One DB round-trip per request tree regardless of how many server components call it |
| Zod validation at AI output boundary | LLM JSON is untrusted — validate before persisting; schema mismatch triggers one retry |
| `cheap` / `smart` model tiers | Balances cost vs quality: question gen is high-volume (cheap); evaluation is quality-critical (smart) |
| Public SEO question bank (`/questions/**`) | Organic acquisition; free preview (question + ELI5 + diagram) fully server-rendered; quiz/AI practice gated behind sign-up. `study-public-service.ts` never selects answer keys |
| `SeedQuestion.slug` assigned once | Never regenerated when question text is edited — URL permanence beats slug freshness |
| SM-2 on `ReviewItem` (not `StudyPlanProgress`) | Interview sessions advance spaced repetition state independently of the study plan; `/review` surfaces any due topic |
| Recharts + Mermaid lazy-loaded | Both are large; dynamic import with `ssr: false` keeps the main bundle lean |
