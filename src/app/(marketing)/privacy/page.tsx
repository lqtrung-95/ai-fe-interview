import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Frontend Coach collects, uses, and protects your data.',
};

const LAST_UPDATED = 'June 20, 2026';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground">

        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Who we are</h2>
          <p>
            Frontend Coach (&quot;we&quot;, &quot;our&quot;, &quot;the service&quot;) is an AI-powered interview
            preparation tool for frontend engineers. We are a solo-operated product.
            Contact: <a href="mailto:letrung95@gmail.com" className="text-primary underline">letrung95@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. What we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Account data</strong> — email address and OAuth provider ID (via Supabase Auth).</li>
            <li><strong>Profile data</strong> — target role, experience level, and preparation preferences you enter during onboarding.</li>
            <li><strong>Session data</strong> — your interview questions, answers, follow-up answers, and AI-generated feedback scores.</li>
            <li><strong>CV data</strong> — if you upload a CV, we store it in a private storage bucket and extract structured data from it (roles, skills, projects). You can delete it at any time from Settings.</li>
            <li><strong>Usage data</strong> — anonymous page-view and interaction events via Vercel Analytics (no personal identifiers).</li>
            <li><strong>Payment data</strong> — handled entirely by Polar. We never see or store your card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. How we use it</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Deliver the interview practice, feedback, and study plan features.</li>
            <li>Personalise AI-generated questions when you enable CV-grounded interviews.</li>
            <li>Track your score trends and surface weak areas on your dashboard.</li>
            <li>Process Pro subscription payments and verify access entitlements.</li>
            <li>Send transactional emails (password reset, subscription confirmation) via Supabase.</li>
          </ul>
          <p className="mt-3">We do not sell your data. We do not use your answers or CV content to train AI models.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. AI providers</h2>
          <p>
            Your interview answers and CV content are sent to third-party LLM APIs
            (DeepSeek, OpenAI, Groq, or Anthropic depending on configuration) to generate
            feedback and questions. These providers process data under their own privacy
            policies. CV parse and review requests are intentionally excluded from AI
            call logs to minimise data exposure.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Data retention</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Session history and scores are kept until you delete your account.</li>
            <li>CV files are deleted immediately when you remove them from Settings, or when your account is deleted.</li>
            <li>Payment records are retained by Polar per their legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data at any time
            by emailing{' '}
            <a href="mailto:letrung95@gmail.com" className="text-primary underline">letrung95@gmail.com</a>.
            Account deletion removes all session data and uploaded files.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Cookies</h2>
          <p>
            We use session cookies set by Supabase Auth to maintain your login state.
            No third-party tracking cookies are used. Vercel Analytics uses a cookie-free,
            privacy-preserving approach.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Changes</h2>
          <p>
            We may update this policy. Material changes will be noted at the top of this page
            with a revised date. Continued use of the service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">9. Contact</h2>
          <p>
            Questions or requests:{' '}
            <a href="mailto:letrung95@gmail.com" className="text-primary underline">letrung95@gmail.com</a>
          </p>
        </section>

      </div>

      <div className="mt-12 flex gap-4 text-sm text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground underline">Terms of Service</Link>
        <Link href="/" className="hover:text-foreground">← Home</Link>
      </div>
    </div>
  );
}
