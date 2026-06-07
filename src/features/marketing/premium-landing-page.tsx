'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Brain,
  Check,
  ChevronDown,
  ClipboardCheck,
  Code2,
  FileText,
  Gauge,
  Layers3,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  MousePointer2,
  PanelTop,
  Radar,
  Sparkles,
  Target,
  Timer,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  ctaHref?: string;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const TRUST = ['React 19 + Next.js depth', 'Senior-level rewrites', 'CV-aware practice', 'No credit card'];

const HOW_IT_WORKS = [
  {
    icon: Target,
    title: 'Choose the interview context',
    body: 'Pick role level, topics, timing, and optional CV or job-description context.',
  },
  {
    icon: MessageSquareText,
    title: 'Answer realistic prompts',
    body: 'Practice one question at a time in a workspace built for structured frontend answers.',
  },
  {
    icon: Radar,
    title: 'Drill the next weak spot',
    body: 'Turn rubric feedback into a focused follow-up session instead of guessing what to study.',
  },
];

const CATEGORIES = [
  { label: 'React rendering', icon: Layers3 },
  { label: 'JavaScript internals', icon: Code2 },
  { label: 'Frontend system design', icon: PanelTop },
  { label: 'Web performance', icon: Gauge },
  { label: 'Browser APIs', icon: MousePointer2 },
  { label: 'Testing strategy', icon: ClipboardCheck },
  { label: 'Behavioral signals', icon: Brain },
  { label: 'CV project deep dives', icon: FileText },
];

const FAQS = [
  {
    question: 'Is this for senior frontend interview prep?',
    answer:
      'Yes. You can practice at junior, mid, or senior level, but the feedback is intentionally calibrated toward senior-level clarity, trade-offs, and systems thinking.',
  },
  {
    question: 'Can it tailor questions to my CV?',
    answer:
      'Yes. Upload or paste a CV, then decide per session whether that context should influence questions and follow-ups.',
  },
  {
    question: 'What does the AI feedback include?',
    answer:
      'Each answer receives dimension scores, missing points, technical corrections, improvement suggestions, and a stronger answer example.',
  },
  {
    question: 'Can I use it without paying?',
    answer:
      'Yes. The free tier lets you start practicing and inspect the question bank. Pro unlocks unlimited sessions, history, spaced repetition, and deeper targeting.',
  },
];

const FREE_FEATURES = ['1 session per day', 'Question bank access', 'AI feedback', 'Basic score breakdown'];
const PRO_FEATURES = [
  'Unlimited mock interviews',
  'Full history and answer replays',
  'Weak-area coaching dashboard',
  'CV and target-role practice',
  'Spaced repetition study plan',
  'Priority AI responses',
];

export function PremiumLandingPage({ ctaHref = '/sign-in?next=/onboarding' }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative isolate overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--brand-indigo) 17%, transparent), transparent 30rem), radial-gradient(circle at 92% 22%, color-mix(in oklab, var(--brand-teal) 9%, transparent), transparent 24rem), radial-gradient(circle at 8% 44%, color-mix(in oklab, var(--brand-pink) 9%, transparent), transparent 26rem)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(color-mix(in_oklab,var(--primary)_12%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--primary)_12%,transparent)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
      />

      <Hero ctaHref={ctaHref} reduceMotion={reduceMotion} />
      <StatsStrip />
      <HowItWorks />
      <InterviewWorkspace />
      <FeedbackSection />
      <WeaknessSection />
      <CvPracticeSection />
      <QuestionBankSection />
      <CategoriesSection />
      <PricingSection ctaHref={ctaHref} />
      <FaqSection />
      <FinalCta ctaHref={ctaHref} />
    </div>
  );
}

function Hero({ ctaHref, reduceMotion }: { ctaHref: string; reduceMotion: boolean | null }) {
  return (
    <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10">
        <motion.div variants={fadeUp} className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary shadow-primary/10">
          <Sparkles className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">AI mock interviews for serious frontend engineers</span>
        </motion.div>
        <motion.h1 variants={fadeUp} className="max-w-3xl text-5xl font-semibold leading-[1.03] text-foreground sm:text-6xl lg:text-7xl">
          Get senior-ready for frontend interviews.
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base leading-8 text-foreground/80 sm:text-lg">
          FrontEnd Coach runs realistic React, JavaScript, performance, and frontend system design interviews, then turns every answer into scored feedback, stronger rewrites, and a focused practice plan.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 min-[460px]:flex-row">
          <Link
            href={ctaHref}
            className={buttonVariants({
              size: 'lg',
              className:
                'marketing-gradient-button h-11 rounded-lg px-5 text-primary-foreground',
            })}
          >
            Start free interview <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/demo"
            className={buttonVariants({
              size: 'lg',
              variant: 'outline',
              className:
                'h-11 rounded-lg border-border bg-card/80 px-5 text-foreground backdrop-blur-xl hover:bg-card',
            })}
          >
            View sample feedback
          </Link>
        </motion.div>
        <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-2.5">
          {TRUST.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground/80">
              <Check className="size-3.5 text-primary" />
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
        className="relative min-h-[520px] lg:min-h-[640px]"
      >
        <ProductHeroPreview />
        <FloatingCard
          reduceMotion={reduceMotion}
          className="absolute left-0 top-4 hidden w-64 lg:block"
          delay={0}
          icon={MessageSquareText}
          title="AI follow-up"
          body="Can you separate hydration cost from render cost in this flow?"
        />
        <FloatingCard
          reduceMotion={reduceMotion}
          className="absolute -right-1 top-20 hidden w-64 lg:block"
          delay={0.8}
          icon={BadgeCheck}
          title="Feedback signal"
          body="Strong on correctness. Missing rollout metrics and INP measurement."
        />
        <FloatingCard
          reduceMotion={reduceMotion}
          className="absolute bottom-8 left-8 hidden w-72 lg:block"
          delay={1.4}
          icon={BookOpenCheck}
          title="Study plan"
          body="Next drill: React performance budgets for marketplace search."
        />
      </motion.div>
    </section>
  );
}

function ProductHeroPreview() {
  return (
    <div className="absolute inset-x-0 top-8 mx-auto w-full max-w-2xl lg:top-20">
      <div className="relative overflow-hidden rounded-lg border border-border bg-card/80 shadow-[0_28px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-indigo/80 to-transparent" />
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brand-pink/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-brand-teal/80" />
          </div>
          <div className="rounded-full border border-border/80 bg-card/60 px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
            Senior React mock
          </div>
        </div>
        <div className="grid gap-0 md:grid-cols-[0.88fr_1.12fr]">
          <aside className="border-b border-border/80 bg-card/40 p-4 md:border-b-0 md:border-r">
            <div className="rounded-lg border border-primary/20 bg-primary/8 p-3">
              <p className="text-[10px] font-bold uppercase text-brand-pink">Session setup</p>
              <p className="mt-2 text-sm font-semibold text-foreground">Senior Frontend Engineer</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">React rendering, web performance, system design</p>
            </div>
            <div className="mt-3 space-y-2">
              {['Question generation', 'Live answer', 'AI evaluation'].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/70 px-3 py-2.5">
                  <span className="text-xs text-foreground/80">{item}</span>
                  <span className={cn('size-2 rounded-full', index === 1 ? 'bg-primary' : 'bg-brand-teal')} />
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-primary/16 bg-primary/7 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Timer</span>
                <Timer className="size-4 text-primary" />
              </div>
              <p className="mt-2 font-mono text-2xl text-foreground">04:38</p>
            </div>
          </aside>
          <div className="p-4">
            <div className="rounded-lg border border-border/80 bg-background p-4">
              <p className="text-[10px] font-bold uppercase text-muted-foreground/70">Question 2 of 5</p>
              <h2 className="mt-2 text-base font-semibold leading-6 text-foreground">
                Explain how you would diagnose a slow React dashboard after a release.
              </h2>
              <div className="mt-4 rounded-lg border border-border/70 bg-card/60 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Code2 className="size-4 text-brand-pink" />
                  Your structured answer
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="h-2 rounded-full bg-muted" />
                  <div className="h-2 w-11/12 rounded-full bg-muted" />
                  <div className="h-2 w-4/5 rounded-full bg-muted" />
                  <div className="h-2 w-2/3 rounded-full bg-muted" />
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ['Correctness', '4.4'],
                ['Depth', '3.6'],
                ['Trade-offs', '4.1'],
              ].map(([label, score]) => (
                <div key={label} className="rounded-lg border border-border/80 bg-primary/[0.04] p-3">
                  <p className="text-[10px] text-muted-foreground/70">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingCard({
  body,
  className,
  delay,
  icon: Icon,
  reduceMotion,
  title,
}: {
  body: string;
  className: string;
  delay: number;
  icon: LucideIcon;
  reduceMotion: boolean | null;
  title: string;
}) {
  return (
    <motion.div
      animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 5.5, delay, repeat: Infinity, ease: 'easeInOut' }}
      className={cn('rounded-lg border border-border bg-card/80 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.36)] backdrop-blur-2xl', className)}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StatsStrip() {
  return (
    <section className="border-y border-border/80 bg-card/25">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-8 sm:px-6 lg:grid-cols-4">
        {[
          ['250+', 'frontend questions'],
          ['6', 'feedback dimensions'],
          ['7', 'interview categories'],
          ['24/7', 'AI practice loop'],
        ].map(([value, label]) => (
          <div key={label} className="px-3 text-center">
            <p className="bg-gradient-to-r from-foreground via-brand-indigo to-brand-pink bg-clip-text text-3xl font-semibold text-transparent">{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground/70">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <MarketingSection
      eyebrow="How it works"
      title="A complete loop for deliberate interview practice."
      body="FrontEnd Coach keeps the workflow tight: choose context, answer under pressure, then practice the precise concept that held you back."
    >
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="grid gap-4 md:grid-cols-3">
        {HOW_IT_WORKS.map((item, index) => (
          <MotionCard key={item.title} className="p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-card/80 text-primary ring-1 ring-border">
              <item.icon className="size-5" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase text-muted-foreground/70">Step {index + 1}</p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
          </MotionCard>
        ))}
      </motion.div>
    </MarketingSection>
  );
}

function InterviewWorkspace() {
  return (
    <MarketingSection
      id="workspace"
      eyebrow="Interview workspace"
      title="Practice in an environment that feels closer to the real loop."
      body="Structured prompts, timing, voice input, and follow-ups help you rehearse how you actually need to think and communicate."
      tinted
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <MotionCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground/70">Live workspace</p>
            <span className="rounded-full bg-brand-teal/10 px-2.5 py-1 text-xs font-semibold text-brand-teal">Streaming</span>
          </div>
          <div className="grid gap-0 md:grid-cols-[0.7fr_1.3fr]">
            <div className="border-b border-border/80 p-4 md:border-b-0 md:border-r">
              {['React', 'Senior', 'Deep coaching'].map((tag) => (
                <div key={tag} className="mb-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-xs text-foreground/80">
                  {tag}
                </div>
              ))}
              <div className="mt-4 rounded-lg bg-gradient-to-br from-brand-indigo/16 to-brand-teal/10 p-4 ring-1 ring-border">
                <p className="text-xs font-semibold text-primary">Next follow-up</p>
                <p className="mt-2 text-sm leading-6 text-foreground/80">What would you instrument first to prove the regression?</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-foreground">Your answer outline</p>
              <div className="mt-4 space-y-3">
                {['Measure before optimizing with React Profiler and Web Vitals.', 'Split network, render, and JavaScript execution costs.', 'Ship budget checks in CI and monitor INP after release.'].map((line) => (
                  <div key={line} className="flex gap-3 rounded-lg border border-border/70 bg-card/70 p-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-sm leading-6 text-foreground/80">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionCard>

        <div className="grid gap-4">
          <FeatureMini icon={Timer} title="Timed pressure" body="Run quick drills or full mock interviews with realistic pacing." />
          <FeatureMini icon={MessageSquareText} title="Targeted follow-ups" body="The interviewer probes weak or incomplete answers before moving on." />
          <FeatureMini icon={LockKeyhole} title="Private practice context" body="CV context is optional and can be removed when you no longer need it." />
        </div>
      </div>
    </MarketingSection>
  );
}

function FeedbackSection() {
  return (
    <MarketingSection
      id="feedback"
      eyebrow="AI feedback"
      title="See what a senior answer was missing."
      body="A single score is not enough. The feedback view separates correctness, completeness, clarity, depth, trade-off thinking, and communication."
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <MotionCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground/70">Answer score</p>
              <p className="mt-2 text-4xl font-semibold text-foreground">3.2<span className="text-lg text-muted-foreground/70">/5</span></p>
            </div>
            <Trophy className="size-10 text-brand-pink" />
          </div>
          <div className="mt-6 space-y-4">
            {[
              ['Correctness', 78],
              ['Completeness', 54],
              ['Depth', 46],
              ['Trade-offs', 42],
              ['Communication', 72],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/80">{label}</span>
                  <span className="font-semibold text-foreground">{value}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-teal" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </MotionCard>
        <MotionCard className="p-5">
          <p className="text-xs font-semibold uppercase text-primary">Senior-level rewrite</p>
          <p className="mt-4 text-sm leading-7 text-foreground/80">
            Start by identifying whether the slowdown is network, JavaScript execution, render work, or layout. I would capture React Profiler commits, Core Web Vitals field data, bundle diff, and long-task traces, then prioritize fixes by user impact.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {['Missed INP measurement', 'No rollout guardrails', 'Needs render/network split', 'Add regression budget'].map((gap) => (
              <div key={gap} className="rounded-lg border border-amber-400/16 bg-amber-400/7 px-3 py-2 text-xs text-amber-300">
                {gap}
              </div>
            ))}
          </div>
        </MotionCard>
      </div>
    </MarketingSection>
  );
}

function WeaknessSection() {
  return (
    <MarketingSection
      eyebrow="Weakness detection"
      title="Find the concepts quietly dragging down your interviews."
      body="The dashboard turns multiple sessions into patterns, not isolated notes."
      tinted
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <MotionCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground/70">Weak areas</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">Current practice priorities</h3>
            </div>
            <LineChart className="size-8 text-primary" />
          </div>
          <div className="mt-5 divide-y divide-border/80">
            {[
              ['React performance', 'Skipped memoization trade-offs and commit-duration evidence.', '42%'],
              ['Web Performance', 'Needs stronger INP, long-task, and CI budget explanation.', '48%'],
              ['System design', 'Missing API contracts and graceful degradation strategy.', '56%'],
            ].map(([topic, detail, width]) => (
              <div key={topic} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{topic}</p>
                  <p className="text-xs font-semibold text-brand-pink">Needs work</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-pink to-brand-indigo" style={{ width }} />
                </div>
              </div>
            ))}
          </div>
        </MotionCard>
        <MotionCard className="p-5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/16">
            <Sparkles className="size-5" />
          </span>
          <h3 className="mt-5 text-xl font-semibold text-foreground">Recommended next drill</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Design a high-traffic product search page with strict latency goals, then explain measurement, fallback states, and release guardrails.
          </p>
          <Link href="/demo" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary">
            Preview a drill <ArrowRight className="size-4" />
          </Link>
        </MotionCard>
      </div>
    </MarketingSection>
  );
}

function CvPracticeSection() {
  return (
    <MarketingSection
      eyebrow="CV-based practice"
      title="Turn your own projects into interview material."
      body="Upload a CV or paste experience notes, then practice questions grounded in the systems, trade-offs, and ownership you already claim."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <MotionCard className="p-5 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Frontend Engineer', 'Checkout verification workflows, latency-sensitive review tools, React Query migration.'],
              ['Senior project prompt', 'Tell me about a time you improved perceived performance under backend constraints.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-border/80 bg-card/60 p-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-primary/16 bg-primary/7 p-4">
            <p className="text-xs font-semibold uppercase text-primary">AI-generated follow-up</p>
            <p className="mt-2 text-sm leading-6 text-foreground/80">
              Which metrics proved the migration helped users, and what trade-off would you call out to a staff engineer?
            </p>
          </div>
        </MotionCard>
        <MotionCard className="p-5">
          <FileText className="size-9 text-brand-pink" />
          <h3 className="mt-5 text-lg font-semibold text-foreground">ATS-aware CV review</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Get frontend-specific gaps, stronger bullet suggestions, keyword coverage, and clearer impact framing.
          </p>
        </MotionCard>
      </div>
    </MarketingSection>
  );
}

function QuestionBankSection() {
  return (
    <MarketingSection
      eyebrow="Question bank"
      title="Study from a bank built around frontend depth."
      body="Browse explanations, diagrams, quizzes, and handbooks when you need to study before another mock session."
      tinted
    >
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <MotionCard className="p-5">
          <BookOpenCheck className="size-9 text-primary" />
          <h3 className="mt-5 text-lg font-semibold text-foreground">From question to concept</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Save questions, read detailed notes, test recall, and return to spaced repetition when the topic is due.
          </p>
        </MotionCard>
        <MotionCard className="p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {['Virtual DOM and Fiber', 'Core Web Vitals', 'Event loop and tasks', 'Autocomplete system design'].map((item) => (
              <div key={item} className="rounded-lg border border-border/80 bg-card/70 p-4">
                <p className="text-sm font-semibold text-foreground">{item}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground/70">Explanation · diagram · quiz · flashcard</p>
              </div>
            ))}
          </div>
        </MotionCard>
      </div>
    </MarketingSection>
  );
}

function CategoriesSection() {
  return (
    <MarketingSection
      eyebrow="Supported categories"
      title="Everything frontend interviews actually test."
      body="Practice the fundamentals, the senior-level trade-offs, and the communication layer between them."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map(({ icon: Icon, label }) => (
          <MotionCard key={label} className="flex items-center gap-3 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card/80 text-primary ring-1 ring-border">
              <Icon className="size-4.5" />
            </span>
            <p className="text-sm font-semibold text-foreground">{label}</p>
          </MotionCard>
        ))}
      </div>
    </MarketingSection>
  );
}

function PricingSection({ ctaHref }: { ctaHref: string }) {
  return (
    <MarketingSection
      id="pricing"
      eyebrow="Pricing"
      title="Start free. Upgrade when the prep loop is working."
      body="No credit card to begin. Pro is for engineers who want unlimited sessions, history, and a complete study system."
      tinted
    >
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <PricingCard name="Free" price="$0" note="for starting practice" features={FREE_FEATURES} ctaHref={ctaHref} cta="Start free" />
        <PricingCard name="Pro" price="$5" note="/ month or $19 one-time" features={PRO_FEATURES} ctaHref={ctaHref} cta="Start Pro prep" featured />
      </div>
    </MarketingSection>
  );
}

function PricingCard({
  cta,
  ctaHref,
  featured,
  features,
  name,
  note,
  price,
}: {
  cta: string;
  ctaHref: string;
  featured?: boolean;
  features: string[];
  name: string;
  note: string;
  price: string;
}) {
  return (
    <MotionCard className={cn('relative flex flex-col p-6', featured && 'border-primary/30 bg-primary/[0.055] shadow-primary/10')}>
      {featured ? (
        <span className="absolute right-4 top-4 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          Most useful
        </span>
      ) : null}
      <p className="text-xs font-semibold uppercase text-muted-foreground/70">{name}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-semibold text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground">{note}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={buttonVariants({
          className: cn(
            'mt-7 h-10 rounded-lg',
            featured
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border-border bg-card/80 text-foreground hover:bg-card',
          ),
          variant: featured ? 'default' : 'outline',
        })}
      >
        {cta}
      </Link>
    </MotionCard>
  );
}

function FaqSection() {
  return (
    <MarketingSection eyebrow="FAQ" title="Questions before you start." body="Straight answers for engineers evaluating whether this belongs in their prep workflow.">
      <div className="mx-auto max-w-3xl divide-y divide-border/80 rounded-lg border border-border/80 bg-card/60">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground marker:hidden">
              {faq.question}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground/70 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </MarketingSection>
  );
}

function FinalCta({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-20">
      <div
        className="relative overflow-hidden rounded-lg border border-border/80 px-6 py-14 text-center shadow-[0_28px_110px_rgba(0,0,0,0.42)]"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in oklab, var(--brand-indigo) 18%, var(--card)), color-mix(in oklab, var(--brand-pink) 8%, var(--card)) 48%, color-mix(in oklab, var(--brand-teal) 6%, var(--card)))',
        }}
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--foreground) 10%, transparent), transparent 26rem)',
          }}
        />
        <p className="text-xs font-bold uppercase text-primary">Prepare with a sharper loop</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
          Walk into senior frontend interviews with better answers ready.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-foreground/80">
          Start a free mock interview, identify the gaps, and turn your next practice session into targeted progress.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 min-[460px]:flex-row">
          <Link href={ctaHref} className={buttonVariants({ size: 'lg', className: 'h-11 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90' })}>
            Start free interview <ArrowRight className="size-4" />
          </Link>
          <Link href="/resources" className={buttonVariants({ size: 'lg', variant: 'outline', className: 'h-11 rounded-lg border-border bg-card/80 px-5 text-foreground hover:bg-card' })}>
            Browse resources
          </Link>
        </div>
      </div>
    </section>
  );
}

function MarketingSection({
  body,
  children,
  eyebrow,
  id,
  tinted,
  title,
}: {
  body: string;
  children: React.ReactNode;
  eyebrow: string;
  id?: string;
  tinted?: boolean;
  title: string;
}) {
  return (
    <section id={id} className={cn('relative border-t border-border/80', tinted && 'bg-card/25')}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={fadeUp} className="mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{body}</p>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function MotionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      className={cn('rounded-lg border border-border/80 bg-card/70 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl', className)}
    >
      {children}
    </motion.div>
  );
}

function FeatureMini({ body, icon: Icon, title }: { body: string; icon: LucideIcon; title: string }) {
  return (
    <MotionCard className="p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-card/80 text-brand-pink ring-1 ring-border">
        <Icon className="size-4.5" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </MotionCard>
  );
}
