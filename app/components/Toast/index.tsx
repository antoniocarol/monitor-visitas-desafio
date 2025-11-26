"use client";

import { ToastMessage } from "../../types/monitor";

const TYPE_STYLES: Record<ToastMessage["type"], string> = {
  success: "bg-green-500/20 border-green-500/50 text-green-100",
  error: "bg-red-500/20 border-red-500/50 text-red-100",
  info: "bg-blue-500/20 border-blue-500/50 text-blue-100",
};

const TYPE_ICONS: Record<ToastMessage["type"], string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps): React.JSX.Element {
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-md border
        ${TYPE_STYLES[toast.type]}
        animate-slide-in shadow-lg
      `}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-bold text-sm">
        {TYPE_ICONS[toast.type]}
      </span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-white/60 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps): React.JSX.Element | null {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-100 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
