import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const roundedClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'rectangular'
      ? 'rounded-xl'
      : 'rounded-md';

  const defaultHeight =
    variant === 'text' ? 'h-4' : variant === 'circular' ? 'h-10 w-10' : 'h-24';

  return (
    <div
      className={`animate-shimmer ${roundedClass} ${!height ? defaultHeight : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="40%" height={24} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton width="75%" height={16} className="mb-2" />
      <Skeleton width="60%" height={16} className="mb-6" />
      <div className="space-y-2">
        <Skeleton width="100%" height={12} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="65%" height={12} />
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 4,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xs ${className}`}
    >
      <div className="border-b border-white/10 bg-white/5 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height={18} width="70%" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/5 p-4 space-y-4">
        {Array.from({ length: rows }).map((_, rIndex) => (
          <div
            key={rIndex}
            className="grid gap-4 pt-3 first:pt-0"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, cIndex) => (
              <Skeleton key={cIndex} height={16} width={cIndex === 0 ? '80%' : '50%'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreDialSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 bg-white/5 shadow-xs ${className}`}
    >
      <Skeleton variant="circular" width={140} height={140} className="mb-4" />
      <Skeleton width={120} height={22} className="mb-2" />
      <Skeleton width={180} height={14} />
    </div>
  );
}

export function TimelineSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton width={2} height={60} className="my-1" />
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton width="45%" height={20} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="70%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
