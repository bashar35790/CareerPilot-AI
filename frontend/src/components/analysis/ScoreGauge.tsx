'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export interface ScoreColor {
  stroke: string;
  text: string;
  label: string;
}

export function getScoreColor(score: number): ScoreColor {
  if (score >= 80) {
    return { stroke: '#10b981', text: 'text-emerald-600', label: 'Strong match' };
  }
  if (score >= 60) {
    return { stroke: '#6366f1', text: 'text-indigo-600', label: 'Good match' };
  }
  if (score >= 40) {
    return { stroke: '#f59e0b', text: 'text-amber-600', label: 'Partial match' };
  }
  return { stroke: '#f43f5e', text: 'text-rose-600', label: 'Weak match' };
}

export interface ScoreGaugeProps {
  score: number;
  label?: string;
}

export function ScoreGauge({ score, label = 'Overall Match' }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = getScoreColor(clamped);
  const data = [
    { name: 'score', value: clamped },
    { name: 'remainder', value: 100 - clamped },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-48" role="img" aria-label={`${label}: ${clamped}%`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius="72%"
              outerRadius="100%"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={color.stroke} />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold tabular-nums ${color.text}`}>
            {clamped}%
          </span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
        </div>
      </div>
      <span className={`mt-2 text-sm font-semibold ${color.text}`}>{color.label}</span>
    </div>
  );
}

export default ScoreGauge;
