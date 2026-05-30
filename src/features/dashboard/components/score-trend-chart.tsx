'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
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
        <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreBar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 6" vertical={false} />
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
            tickMargin={8}
            width={32}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.25 }}
            labelFormatter={(label) => (typeof label === 'string' ? formatShortDate(label) : '')}
            formatter={(value) => [
              typeof value === 'number' ? value.toFixed(2) : String(value ?? ''),
              'Avg score',
            ]}
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--foreground)',
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="avgScore"
            fill="url(#scoreBar)"
            radius={[6, 6, 2, 2]}
            barSize={18}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
