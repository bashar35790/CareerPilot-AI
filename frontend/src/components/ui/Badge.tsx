import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'purple'
  | 'matched'
  | 'missing-required'
  | 'missing-preferred';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  },
  success: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  matched: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  danger: {
    container: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  'missing-required': {
    container: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  warning: {
    container: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  'missing-preferred': {
    container: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  info: {
    container: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  purple: {
    container: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const currentVariant = variantStyles[variant] || variantStyles.default;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${currentVariant.container} ${currentSize} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentVariant.dot}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
