'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export interface SkillCoverageChartProps {
  matched: number;
  missingRequired: number;
}

export function SkillCoverageChart({ matched, missingRequired }: SkillCoverageChartProps) {
  const total = matched + missingRequired;
  const coverage = total === 0 ? 0 : Math.round((matched / total) * 100);

  const data =
    total === 0
      ? [{ name: 'No required skills', value: 1, fill: '#27272a' }]
      : [
          { name: 'Matched', value: matched, fill: '#10b981' },
          { name: 'Missing required', value: missingRequired, fill: '#f43f5e' },
        ];

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-40 w-40"
        role="img"
        aria-label={`Required skill coverage: ${coverage}%`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius="70%"
              outerRadius="100%"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tabular-nums text-white">
            {coverage}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Covered
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Matched <span className="font-semibold tabular-nums">{matched}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" />
          Missing <span className="font-semibold tabular-nums">{missingRequired}</span>
        </span>
      </div>
    </div>
  );
}

export default SkillCoverageChart;
