# AI Interview Coach

A full-stack web app that runs realistic AI-led frontend engineering interviews, scores every answer against a rubric, and builds a personalised study plan that adapts as you improve.

Live demo: [ai-fe-interview.vercel.app](https://ai-fe-interview.vercel.app/demo) (no sign-in required)

---

## Features

| Feature | Description |
|---|---|
| **AI Interview Sessions** | Adaptive questions across React, JavaScript, TypeScript, Web Performance, Testing, and more. Three session modes: Quick (3Q), Standard (5Q), Deep Coaching (5Q). |
| **Multi-dimension Scoring** | Every answer is evaluated on Correctness, Completeness, Clarity, Depth, Trade-off Thinking, and Communication (1–5 scale). |
| **Follow-up Questions** | AI probes weak spots with a targeted follow-up before moving on. |
| **Timed Mode** | Optional per-question countdown (1 / 2 / 3 / 5 min) with a visual ring; auto-submits when time expires. |
| **Voice Input** | Browser-native Web Speech API — click the mic, speak your answer, edit before submitting. No audio stored. |
| **Answer Review** | History detail page shows every question, your answer, per-dimension scores, the AI's better-answer, and follow-up Q&A. |
| **Session Management** | Resume in-progress sessions or remove them from history. |
| **Spaced Repetition Study Plan** | SM-2 algorithm schedules questions for review; each session surfaces what's due today. |
| **Question Bank** | Browse 300+ seed questions with ELI5 explanations, diagrams, quizzes, and deep-dive content. Star questions to bookmark. |
| **Dashboard** | Score trend chart, topic radar, weak-area list, and AI-recommended next sessions. |
| **Dark / Light Mode** | Persists preference; respects OS default. |
| **Keyboard Shortcuts** | `⌘↵` submit answer / follow-up, `Esc` skip follow-up. |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand (interview state machine) + TanStack Query v5 |
| Database | Supabase Postgres (via Prisma 7 + `@prisma/adapter-pg`) |
| Auth | Supabase Auth (email magic link / password) |
| AI | Vercel AI SDK — routes to DeepSeek · Groq · OpenAI · Anthropic |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- A [Supabase](https://supabase.com) project
- At least one AI provider API key (DeepSeek is the default — cheapest option)

### 1. Clone and install

```bash
git clone https://github.com/lqtrung-95/ai-fe-interview.git
cd ai-fe-interview
pnpm install
```

### 2. Configure environment variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Database — use the Transaction Pooler URL (port 6543) for the app at runtime
DATABASE_URL=postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true

# AI provider (pick one or mix — see model router section below)
LLM_PROVIDER=deepseek           # deepseek | groq | openai | anthropic

# Provider API keys — only the one(s) you use are required
DEEPSEEK_API_KEY=sk-...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

#### AI model router

Two tiers route independently:
- `LLM_CHEAP_PROVIDER` — question generation, follow-up generation (high-volume)
- `LLM_SMART_PROVIDER` — answer evaluation, session summary (quality-critical)
- `LLM_PROVIDER` — fallback for both tiers when overrides are absent

```env
# Example: cheap tasks on Groq (fast + free tier), smart tasks on Anthropic
LLM_CHEAP_PROVIDER=groq
LLM_SMART_PROVIDER=anthropic
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Apply the database schema

```bash
# Generate Prisma client
pnpm db:generate

# Apply schema to Supabase via SQL editor
# Copy the contents of prisma/migrations/ and run in Supabase Studio → SQL Editor
# (prisma migrate deploy requires a direct connection — see note below)
```

> **Note on migrations:** Supabase's default connection URL uses PgBouncer in transaction mode which is incompatible with `prisma migrate`. To run migrations locally, temporarily swap `DATABASE_URL` to the **Direct connection** string (Project Settings → Database → Connection String → URI, port 5432), run `pnpm db:migrate`, then restore the pooler URL.

### 4. Seed the question bank

```bash
pnpm seed
```

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type-check (no emit) |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:migrate` | Run pending migrations (requires direct DB connection) |
| `pnpm db:push` | Push schema changes without migration history |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm seed` | Seed questions from `src/lib/seed/` |
| `pnpm seed:diagrams` | Generate SVG diagrams for seeded questions |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages & API routes
│   ├── (app)/                  # Authenticated app shell
│   │   ├── dashboard/
│   │   ├── history/[sessionId]/
│   │   ├── practice/[sessionId]/
│   │   ├── question-bank/[id]/
│   │   ├── study-plan/
│   │   └── settings/
│   ├── (marketing)/            # Public landing + demo
│   ├── api/                    # API route handlers
│   └── sign-in/
├── features/                   # Feature slices (colocated UI + server logic)
│   ├── dashboard/
│   ├── feedback/
│   ├── history/
│   ├── interview/              # Session state machine, question streaming
│   ├── study/                  # Question bank browsing
│   ├── study-plan/             # SM-2 spaced repetition
│   └── ...
├── lib/
│   ├── ai/                     # Model router, prompts, AI task schemas
│   ├── auth/                   # Supabase auth helpers
│   └── db/                     # Prisma client setup
└── components/                 # Shared UI components
```

---

## Deployment (Vercel)

1. Push to GitHub and import into Vercel.
2. Add all environment variables from `.env.local` to Vercel project settings.
3. Vercel runs `pnpm build` which includes `prisma generate` — no direct DB connection needed at build time.
4. Apply new migrations manually via Supabase Studio SQL editor before deploying schema changes.

---

## License

MIT
