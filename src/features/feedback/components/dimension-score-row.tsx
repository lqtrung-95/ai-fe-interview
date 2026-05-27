interface Props {
  label: string;
  score: number;
}

export function DimensionScoreRow({ label, score }: Props) {
  const width = `${Math.max(0, Math.min(5, score)) * 20}%`;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/5</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-muted">
        <div className="h-full rounded bg-foreground" style={{ width }} />
      </div>
    </div>
  );
}
