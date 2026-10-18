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
    container: 'bg-emerald-50 border-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
    textColor: 'text-emerald-700',
  },
  error: {
    container: 'bg-rose-50 border-rose-200',
    icon: AlertCircle,
    iconColor: 'text-rose-600',
    titleColor: 'text-rose-900',
    textColor: 'text-rose-700',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-700',
  },
  info: {
    container: 'bg-indigo-50 border-indigo-200',
    icon: Info,
    iconColor: 'text-indigo-600',
    titleColor: 'text-indigo-900',
    textColor: 'text-indigo-700',
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
      className={`relative flex items-start gap-3 rounded-xl border p-4 shadow-xs transition-all ${current.container} ${className}`}
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
          className={`shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default ToastAlert;
