const FAQS = [
  {
    question: 'Who is Interview Coach for?',
    answer: 'Frontend engineers preparing for junior through staff-level interviews, with a strong focus on senior-level depth.',
  },
  {
    question: 'What topics can I practice?',
    answer: 'JavaScript, React, browser APIs, web performance, frontend system design, testing, and behavioral communication.',
  },
  {
    question: 'What happens after I answer a question?',
    answer: 'You receive rubric-based scores, missing points, a stronger answer example, and recommendations for your next session.',
  },
  {
    question: 'Can I try it before paying?',
    answer: 'Yes. You can start with a free session and decide whether the deeper practice workflow is useful for your preparation.',
  },
];

export function LandingFaq() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">FAQ</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Questions before you start</h2>
      </div>

      <div className="mt-8 divide-y divide-border/70 border-y border-border/70">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="cursor-pointer list-none pr-6 text-sm font-semibold marker:hidden">
              {faq.question}
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
