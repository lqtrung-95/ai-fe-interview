'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART, formatShortDate } from '../chart-config';
import type { ScoreTrendPoint } from '../dashboard-types';

interface Props {
  data: ScoreTrendPoint[];
}

export function ScoreTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <ChartShell title="Score trend (30 days)">
        <p className="px-2 py-12 text-center text-sm text-muted-foreground">
          Complete a session to start your trend line.
        </p>
      </ChartShell>
    );
  }

  return (
    <ChartShell title="Score trend (30 days)">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            stroke={CHART.axis}
            tick={{ fontSize: 11 }}
            tickMargin={6}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            stroke={CHART.axis}
            tick={{ fontSize: 11 }}
            width={24}
          />
          <Tooltip
            cursor={{ stroke: CHART.grid }}
            labelFormatter={(label) => (typeof label === 'string' ? formatShortDate(label) : '')}
            formatter={(value) => [
              typeof value === 'number' ? value.toFixed(2) : String(value ?? ''),
              'Avg score',
            ]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke={CHART.primary}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 1, fill: CHART.primary }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
