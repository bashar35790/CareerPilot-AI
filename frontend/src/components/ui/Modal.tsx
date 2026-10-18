'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
export type ModalSize = 'sm' | 'md' | 'lg';

const toneStyles: Record<ModalTone, string> = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: ModalTone;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  tone = 'blue',
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cardRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !cardRef.current) return;

      const focusable = cardRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm',
        !reduceMotion && 'animate-in fade-in duration-150'
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl outline-hidden sm:p-8',
          sizeStyles[size],
          !reduceMotion && 'animate-in zoom-in-95 duration-150'
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-start gap-2.5">
            {Icon && (
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                  toneStyles[tone]
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
            <div>
              <h3 id={titleId} className="text-lg font-bold text-white">
                {title}
              </h3>
              {description && (
                <p id={descriptionId} className="mt-0.5 text-xs text-neutral-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
