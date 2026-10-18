import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-white/15 bg-white/5 ${className}`}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-xs">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-neutral-400 leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
