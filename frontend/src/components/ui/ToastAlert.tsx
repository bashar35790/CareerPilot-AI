import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  {
    container: string;
    icon: typeof Info;
    iconColor: string;
    titleColor: string;
    textColor: string;
  }
> = {
  success: {
    container: 'bg-emerald-500/10 border-emerald-500/30',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-200',
    textColor: 'text-emerald-300',
  },
  error: {
    container: 'bg-rose-500/10 border-rose-500/30',
    icon: AlertCircle,
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-200',
    textColor: 'text-rose-300',
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-200',
    textColor: 'text-amber-300',
  },
  info: {
    container: 'bg-blue-500/10 border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-200',
    textColor: 'text-blue-300',
  },
};

export function ToastAlert({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}: ToastAlertProps) {
  const current = variantStyles[variant] || variantStyles.info;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border p-4 backdrop-blur-md transition-all ${current.container} ${className}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${current.iconColor}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-semibold mb-0.5 ${current.titleColor}`}>
            {title}
          </h4>
        )}
        <p className={`text-sm leading-relaxed ${current.textColor}`}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 rounded-lg p-1 text-neutral-400 hover:text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default ToastAlert;
