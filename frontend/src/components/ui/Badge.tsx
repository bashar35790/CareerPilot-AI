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
    container: 'bg-white/10 text-neutral-300 border-white/15',
    dot: 'bg-neutral-400',
  },
  success: {
    container: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  matched: {
    container: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  danger: {
    container: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  'missing-required': {
    container: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  warning: {
    container: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  'missing-preferred': {
    container: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  info: {
    container: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  purple: {
    container: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dot: 'bg-violet-400',
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
