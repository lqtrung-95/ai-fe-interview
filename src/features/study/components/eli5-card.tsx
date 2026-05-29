/**
 * "Explain Like I'm 5" amber card — shown at the top of every study detail page
 * that has a childExplanation populated (currently all fe-prep.html questions).
 */

interface Props {
  explanation: string;
}

export function Eli5Card({ explanation }: Props) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-5">
      <div className="space-y-2">
        {explanation
          .split(/\n+/)
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">
              {para}
            </p>
          ))}
      </div>
    </div>
  );
}
