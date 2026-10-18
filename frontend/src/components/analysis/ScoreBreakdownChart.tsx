'use client';

import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export interface ScoreBreakdownChartProps {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
}

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ScoreBreakdownChart({
  overallScore,
  skillScore,
  experienceScore,
}: ScoreBreakdownChartProps) {
  const data = [
    { name: 'Overall', value: clamp(overallScore), fill: '#2563eb' },
    { name: 'Skill Match', value: clamp(skillScore), fill: '#10b981' },
    { name: 'Experience', value: clamp(experienceScore), fill: '#7c3aed' },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#a1a1aa' }}
          />
          <Bar dataKey="value" barSize={20} isAnimationActive={false} radius={6}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
        {data.map((entry) => (
          <span key={entry.name} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.fill }}
              aria-hidden="true"
            />
            {entry.name} <span className="font-semibold tabular-nums">{entry.value}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default ScoreBreakdownChart;
