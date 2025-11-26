"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Calendar, Repeat, Square, CheckSquare } from "lucide-react";
import { ProcessedUser } from "../../types/monitor";
import { StatusBadge } from "../StatusBadge";
import { DateDisplay } from "../DateDisplay";
import { formatCPF, formatLastVisitRelative, formatNextVisitRelative } from "../../utils/dateCalculations";
import { STATUS_STYLES } from "../../constants/statusStyles";
import { STATUS_ICONS } from "../../constants/statusIcons";

const LONG_PRESS_DURATION_MS = 500;

interface MonitorCardProps {
  user: ProcessedUser;
  onRegisterVisit: (userId: number) => Promise<void>;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (userId: number) => void;
  onLongPress?: (userId: number) => void;
}

export const MonitorCard = memo(function MonitorCard({
  user,
  onRegisterVisit,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  onLongPress,
}: MonitorCardProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);

  const { status } = user;
  const days = status === "overdue" ? user.daysOverdue : user.daysRemaining;
  const style = STATUS_STYLES[status];
  const StatusIcon = STATUS_ICONS[status];

  // UPDATE HIGHLIGHT FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  useEffect(() => {
    setJustUpdated(true);
    const timer = setTimeout(() => setJustUpdated(false), 1500);
    return () => clearTimeout(timer);
  }, [user.last_verified_date]);
  // UPDATE HIGHLIGHT FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  // LONG PRESS FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    if (isSelectionMode) return;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      onLongPress?.(user.id);
      navigator.vibrate?.(50);
    }, LONG_PRESS_DURATION_MS);
  }, [isSelectionMode, onLongPress, user.id]);

  useEffect(() => clearLongPress, [clearLongPress]);
  // LONG PRESS FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  // INTERACTION FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  const handleClick = useCallback(() => {
    if (isLongPressing.current) {
      isLongPressing.current = false;
      return;
    }
    if (isSelectionMode) onToggleSelection?.(user.id);
  }, [isSelectionMode, onToggleSelection, user.id]);

  const handleRegisterVisit = useCallback(async () => {
    if (isSelectionMode) return;
    setLoading(true);
    try {
      await onRegisterVisit(user.id);
    } finally {
      setLoading(false);
    }
  }, [isSelectionMode, onRegisterVisit, user.id]);
  // INTERACTION FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  return (
    <article
      tabIndex={0}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isSelectionMode) onToggleSelection?.(user.id);
          else handleRegisterVisit();
        }
      }}
      className={`group relative w-full rounded-lg bg-white/5 p-6 backdrop-blur-sm border transition-all duration-300 ease-out
        ${isSelected ? `border-2 ${style.borderStrong} ${style.bg} scale-[0.98]` : "border-white/10 hover:border-white/20"}
        ${!isSelectionMode && "hover:bg-white/10 hover:shadow-2xl hover:shadow-white/5 hover:-translate-y-1"}
        ${isSelectionMode && "cursor-pointer select-none"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
        ${justUpdated ? "ring-2 ring-emerald-400/50 bg-emerald-500/10 shadow-emerald-500/20 shadow-lg" : ""}`}
      aria-selected={isSelectionMode ? isSelected : undefined}
      role={isSelectionMode ? "option" : undefined}
    >
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-3 left-3 z-20"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelection?.(user.id); }}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${isSelected ? style.checkbox : "bg-white/10 text-white/50 hover:bg-white/20"}`}
            >
              {isSelected ? <CheckSquare className="h-5 w-5" strokeWidth={2.5} /> : <Square className="h-5 w-5" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />

      <div className={`relative z-10 ${isSelectionMode ? "pl-8" : ""}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1.5">{user.name}</h3>
            <p className="text-xs text-white/50 font-mono">CPF: {formatCPF(user.cpf)}</p>
          </div>
          <StatusBadge status={status} days={days} />
        </div>

        <dl className="space-y-3 mb-4 text-sm">
          <div className="flex justify-between items-center text-white/70 hover:text-white/90 transition-colors">
            <dt className="text-white/50 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Última visita:</span>
            </dt>
            <dd className="font-semibold text-white/90">
              <DateDisplay date={user.lastVerifiedDateObj} relativeText={formatLastVisitRelative(user.lastVerifiedDateObj)} />
            </dd>
          </div>
          <div className="flex justify-between items-center text-white/70 hover:text-white/90 transition-colors">
            <dt className="text-white/50 flex items-center gap-1.5">
              <StatusIcon className={`w-4 h-4 ${style.textAccent}`} />
              <span>Próxima visita:</span>
            </dt>
            <dd className={`font-semibold flex items-center gap-2 ${style.textAccent}`}>
              <DateDisplay date={user.nextVisitDate} relativeText={formatNextVisitRelative(user.nextVisitDate, status === "overdue" ? -days : days)} />
              {status === "overdue" && <span className="text-xs">(VENCEU)</span>}
              {status === "urgent" && days === 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 animate-pulse">HOJE</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between items-center text-white/70 hover:text-white/90 transition-colors">
            <dt className="text-white/50 flex items-center gap-1.5">
              <Repeat className="w-4 h-4" />
              <span>Frequência:</span>
            </dt>
            <dd className="font-semibold text-white/90">A cada {user.verify_frequency_in_days} dias</dd>
          </div>
        </dl>

        {!isSelectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRegisterVisit(); }}
            disabled={loading}
            className="w-full min-h-11 py-2.5 px-4 rounded-md font-medium text-sm bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white/90 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-white/5 focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-[0.98]"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Registrando...</span></>
            ) : (
              <><Check className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} /><span>Registrar Visita</span></>
            )}
          </button>
        )}
      </div>
    </article>
  );
});
