"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Trash2 } from "lucide-react";

interface SelectionActionBarProps {
  selectedCount: number;
  isVisible: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClear: () => void;
  onCancel: () => void;
}

export const SelectionActionBar = memo(function SelectionActionBar({
  selectedCount,
  isVisible,
  loading = false,
  onConfirm,
  onClear,
  onCancel,
}: SelectionActionBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom,16px)] pt-4"
        >
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Cancelar seleção"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex-1 text-center">
                <motion.span
                  key={selectedCount}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-sm font-semibold text-white"
                >
                  {selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"}
                </motion.span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClear}
                  disabled={loading || selectedCount === 0}
                  className="flex h-10 items-center gap-1.5 rounded-full px-3 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                  aria-label="Limpar seleção"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden text-sm sm:inline">Limpar</span>
                </button>

                <button
                  onClick={onConfirm}
                  disabled={loading || selectedCount === 0}
                  className="flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-4 font-medium text-white transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600"
                  aria-label={`Registrar ${selectedCount} visitas`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                      <span className="hidden sm:inline">Registrar</span>
                      <span className="sm:hidden">{selectedCount}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
