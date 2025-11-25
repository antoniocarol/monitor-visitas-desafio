"use client";

import { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle, Loader2 } from "lucide-react";
import { ProcessedUser } from "../../types/monitor";
import { STATUS_STYLES, getStatusLabel } from "../../constants/statusStyles";

interface ConfirmationModalProps {
  isOpen: boolean;
  users: ProcessedUser[];
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = memo(function ConfirmationModal({
  isOpen,
  users,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };

    confirmButtonRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={loading ? undefined : onCancel}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 w-full max-w-md overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-900 shadow-2xl md:rounded-2xl bottom-0 left-0 right-0 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Confirmar Registro</h2>
              </div>
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="mb-4 text-sm text-white/70">
                Você está prestes a registrar visita para{" "}
                <span className="font-semibold text-white">{users.length}</span>{" "}
                {users.length === 1 ? "monitorado" : "monitorados"}:
              </p>

              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg bg-white/5 p-3">
                {users.map((user) => {
                  const days = user.status === "overdue" ? user.daysOverdue : user.daysRemaining;
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                      <span className="truncate font-medium text-white/90">{user.name}</span>
                      <span className={`ml-2 whitespace-nowrap text-xs ${STATUS_STYLES[user.status].textAccent}`}>
                        ({getStatusLabel(user.status, days)})
                      </span>
                    </div>
                  );
                })}
              </div>

              {users.some((u) => u.status === "overdue") && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                  <p className="text-yellow-200/80">
                    Alguns monitorados estão com visitas atrasadas. O registro atualizará a data para agora.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-white/10 px-5 py-4">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                ref={confirmButtonRef}
                onClick={onConfirm}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Registrando...</>
                ) : (
                  <><Check className="h-4 w-4" strokeWidth={2.5} />Confirmar</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
