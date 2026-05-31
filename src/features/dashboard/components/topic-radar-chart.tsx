'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART } from '../chart-config';
import type { TopicBreakdownEntry } from '../dashboard-types';

interface Props {
  data: TopicBreakdownEntry[];
}

export function TopicRadarChart({ data }: Props) {
  if (data.length < 3) {
    return (
      <section className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-bold tracking-tight">Topic breakdown</h2>
        <p className="mt-2 px-2 py-12 text-center text-sm text-muted-foreground">
          Practice at least 3 different topics to see the radar.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-sm font-bold tracking-tight">Topic breakdown</h2>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius={88}>
          <PolarGrid stroke={CHART.grid} />
          <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: CHART.axis }} />
          <PolarRadiusAxis
            domain={[0, 5]}
            angle={90}
            tickCount={6}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, _name, entry) => {
              const score = typeof value === 'number' ? value.toFixed(2) : String(value ?? '');
              const answers = (entry?.payload as { answers?: number } | undefined)?.answers ?? 0;
              return [`${score} (${answers} answers)`, 'Avg score'];
            }}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Radar
            name="Avg score"
            dataKey="avgScore"
            stroke={CHART.primary}
            fill={CHART.primarySoft}
            fillOpacity={1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </section>
  );
}
