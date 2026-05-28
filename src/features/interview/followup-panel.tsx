'use client';

interface Props {
  followUp: string;
  value: string;
  onChange: (value: string) => void;
}

export function FollowupPanel({ followUp, value, onChange }: Props) {
  return (
    <section className="space-y-4 rounded-lg border border-border/70 bg-card p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium">Follow-up</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{followUp}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Answer the follow-up, or skip if you want to move on."
        rows={5}
        className="w-full resize-y rounded-md border border-border/70 bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </section>
  );
}
