# FrontEnd Coach

A full-stack AI interview coach for frontend engineers. Run realistic mock interviews, receive structured feedback, identify technical weak areas, and turn each session into a focused practice plan.

Live demo: [ai-fe-interview.vercel.app/demo](https://ai-fe-interview.vercel.app/demo) (no sign-in required)

---

## Features

### Interview Practice

| Feature | Description |
|---|---|
| **Three session modes** | Choose Quick Practice (3 questions), Standard Mock (5 questions), or Deep Coaching (5 questions with detailed guidance). |
| **AI-generated questions** | Practice React, JavaScript, Web Performance, Browser & Web APIs, Testing, Frontend System Design, and Behavioral topics at junior, mid-level, or senior difficulty. |
| **Streaming question generation** | Questions stream into the interview workspace over SSE instead of leaving users on a blank loading state. |
| **Targeted follow-ups** | The AI interviewer probes weak or incomplete answers before moving to the next question. |
| **Timed mode** | Optional 1, 2, 3, or 5 minute countdown with automatic submission when time expires. |
| **Voice input** | Browser-native speech input lets users dictate, edit, and submit an answer. Audio is not stored. |
| **Keyboard shortcuts** | Use `⌘↵` to submit an answer or follow-up and `Esc` to skip a follow-up. |

### Feedback and Progress

| Feature | Description |
|---|---|
| **Six-dimension scoring** | Every answer is scored on Correctness, Completeness, Clarity, Depth, Trade-off Thinking, and Communication. |
| **Senior-level rewrite** | Each evaluation includes missing points, technical corrections, improvement suggestions, a stronger answer, and a senior-level addition. |
| **Session history** | Review completed sessions, inspect answer-level feedback, resume in-progress sessions, or remove abandoned ones. |
| **Score trend and topic radar** | Track score movement over time and compare performance across frontend topics. |
| **Technical weak areas** | The dashboard surfaces low-scoring topics and specific gaps, such as missing INP measurement, Lighthouse CI budgets, or browser API trade-offs. |
| **AI-guided drills** | Start a focused recommended session from the dashboard, with additional technical topics queued for later practice. |

### CV Personalization

| Feature | Description |
|---|---|
| **CV upload or text paste** | Add a PDF or plain-text CV in Settings. Files are stored in a private Supabase Storage bucket. |
| **Structured CV parsing** | AI extracts roles, projects, skills, and technical highlights from the uploaded CV. |
| **CV-grounded interviews** | Optionally generate interview questions based on real projects, responsibilities, and trade-offs from the user's CV. |
| **AI CV review** | Generate an ATS-oriented review with strengths, keyword gaps, impact improvements, action-verb feedback, and frontend-specific suggestions. |
| **Privacy controls** | CV upload is optional, stored CVs can be removed at any time, and CV review output is ephemeral rather than stored in AI telemetry. |

### Study System

| Feature | Description |
|---|---|
| **Question bank** | Browse 250+ questions and growing, with filters, local bookmarks, ELI5 explanations, detailed notes, diagrams, and quizzes. |
| **Spaced repetition plan** | Build a plan by topic, target level, and preparation window. The SM-2 scheduler determines which questions are due for review. |
| **Public resources** | Read deep-dive handbooks for Frontend System Design, JavaScript Core, React, and Optimization, plus cheatsheets and a 133-term glossary. |
| **Dark and light themes** | Theme preference persists and respects the operating-system default. |

### Pro Access

| Feature | Description |
|---|---|
| **Free tier** | Start with one practice session per day, the complete question bank, AI feedback, and score breakdowns. |
| **Pro tier** | Unlock unlimited sessions, full history and replays, spaced repetition, voice input, weak-area coaching, and priority AI responses. |
| **Polar checkout** | Upgrade through Polar using monthly or lifetime checkout, with signed webhook handling for subscription and order updates. |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Client state | Zustand + TanStack Query v5 |
| Database | Supabase Postgres via Prisma 7 and `@prisma/adapter-pg` |
| Auth and storage | Supabase Auth + private Supabase Storage |
| AI | Vercel AI SDK 6 with DeepSeek, Groq, OpenAI, and Anthropic providers |
| Validation | Zod |
| Charts | Recharts |
| Rate limiting | Upstash Redis |
| Payments | Polar |
| Deployment | Vercel |

---

## AI Architecture

Interview AI tasks route through `src/lib/ai/orchestrator.ts`. The orchestrator validates inputs and structured outputs, applies task-specific token budgets, retries retryable failures, streams question generation, and records cost telemetry.

The model router supports two tiers:

- `LLM_CHEAP_PROVIDER`: question and follow-up generation.
- `LLM_SMART_PROVIDER`: answer evaluation and session summaries.
- `LLM_PROVIDER`: fallback when a tier-specific override is not set.

Supported values are `deepseek`, `groq`, `openai`, and `anthropic`. DeepSeek is the default fallback.

CV parsing and CV review use separate privacy-conscious flows. Parsed CV content and generated CV reviews are intentionally excluded from `AICall` telemetry.

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- A [Supabase](https://supabase.com) project
- At least one supported AI provider API key
- Optional: Upstash Redis for production rate limiting
- Optional: Polar account for Pro checkout

### 1. Install dependencies

```bash
git clone https://github.com/lqtrung-95/ai-fe-interview.git
cd ai-fe-interview
pnpm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values you need:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_WEBHOOK_SECRET=

# Runtime database connection: use the Supabase Session Pooler URL on port 5432
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

# Optional direct connection for Prisma CLI operations
DIRECT_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres

# AI provider routing
LLM_PROVIDER=deepseek
LLM_CHEAP_PROVIDER=
LLM_SMART_PROVIDER=
DEEPSEEK_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App origin
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional Polar billing
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_SERVER=sandbox
NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID=
NEXT_PUBLIC_POLAR_LIFETIME_PRODUCT_ID=
```

For the full environment template, see [`.env.local.example`](./.env.local.example).

### 3. Create the private CV storage bucket

If you want CV personalization, create a private Supabase Storage bucket named `cvs`. CV files are written under `{userId}/resume.pdf` or `{userId}/resume.txt` and are never exposed as public URLs.

### 4. Generate Prisma client and apply schema

Prisma 7 reads CLI connection configuration from [`prisma.config.ts`](./prisma.config.ts). The runtime Prisma client uses `@prisma/adapter-pg`.

```bash
pnpm db:generate
pnpm db:push
```

For production, apply migrations before deploying. Use `DIRECT_URL` for Prisma CLI operations when your runtime URL is pooled.

### 5. Seed the question bank

```bash
pnpm seed
```

### 6. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server with Turbopack |
| `pnpm build` | Generate Prisma client and create a production build |
| `pnpm typecheck` | Run TypeScript validation without emitting files |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:push` | Push schema changes without migration history |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm seed` | Seed the question bank |
| `pnpm seed:diagrams` | Generate diagrams for seeded questions |

Additional extraction and handbook-generation scripts are listed in [`package.json`](./package.json).

---

## Project Structure

```text
src/
├── app/
│   ├── (app)/                    # Authenticated application shell
│   │   ├── cv-review/            # AI CV feedback
│   │   ├── dashboard/            # Progress, weak areas, recommendations
│   │   ├── history/              # Session list and answer review
│   │   ├── onboarding/
│   │   ├── practice/             # Session setup and live interview
│   │   ├── question-bank/
│   │   ├── settings/             # Profile, preferences, CV management
│   │   ├── study-plan/
│   │   └── upgrade/              # Polar Pro checkout entry
│   ├── (marketing)/              # Landing page and static demo
│   ├── (reader)/resources/       # Public handbooks, cheatsheets, glossary
│   └── api/
│       ├── answers/              # Submit, evaluate, follow up
│       ├── checkout/             # Polar hosted checkout
│       ├── cv/                   # Parse, delete, review
│       ├── sessions/             # Read, stream questions, complete, end
│       ├── study-plan/
│       └── webhooks/polar/
├── features/                     # Vertical feature slices
│   ├── cv-review/
│   ├── dashboard/
│   ├── feedback/
│   ├── history/
│   ├── interview/
│   ├── settings/
│   ├── study/
│   └── study-plan/
├── lib/
│   ├── ai/                       # Orchestrator, router, prompts, telemetry
│   ├── auth/
│   ├── cv/                       # CV parsing and private storage helpers
│   ├── db/
│   └── rate-limit/
└── components/ui/                # Shared shadcn primitives
```

---

## Deployment

1. Create a Vercel project from the repository.
2. Configure the required Supabase, AI provider, and `NEXT_PUBLIC_APP_URL` variables.
3. Add Upstash variables if rate limiting is enabled.
4. Add Polar product, checkout, and webhook variables if Pro billing is enabled.
5. Create the private `cvs` bucket if CV personalization is enabled.
6. Apply database migrations before deploying schema-dependent code.
7. Deploy. Vercel runs `pnpm build`, which generates Prisma client before the Next.js build.

---

## License

MIT
