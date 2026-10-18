'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { ToastAlert, AlertVariant } from './ToastAlert';

export interface ToastItem {
  id: string;
  variant: AlertVariant;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 4500;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => addToast({ variant: 'success', message, title }),
    [addToast]
  );
  const error = useCallback(
    (message: string, title?: string) => addToast({ variant: 'error', message, title }),
    [addToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => addToast({ variant: 'warning', message, title }),
    [addToast]
  );
  const info = useCallback(
    (message: string, title?: string) => addToast({ variant: 'info', message, title }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      {/* Toast floating container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <ToastAlert
              variant={toast.variant}
              title={toast.title}
              message={toast.message}
              onClose={() => removeToast(toast.id)}
              className="shadow-lg"
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
