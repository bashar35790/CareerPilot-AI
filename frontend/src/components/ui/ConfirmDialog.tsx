'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={AlertTriangle}
      tone="rose"
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="cursor-pointer rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-white/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isConfirming && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-neutral-300">
        {description}
      </p>
    </Modal>
  );
}

export default ConfirmDialog;
