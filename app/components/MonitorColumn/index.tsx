"use client";

import { memo, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, ChevronDown, CheckCircle, Square, CheckSquare, Minus } from "lucide-react";
import { ProcessedUser, MonitorStatus } from "../../types/monitor";
import { MonitorCard } from "../MonitorCard";
import { SkeletonList } from "../Skeleton";
import { AnimatedCounter } from "../AnimatedCounter";
import { STATUS_STYLES } from "../../constants/statusStyles";
import { STATUS_ICONS } from "../../constants/statusIcons";

const EMPTY_MESSAGES = {
  overdue: { title: "Tudo em dia!", description: "Não há visitas atrasadas no momento" },
  urgent: { title: "Nenhum item urgente", description: "Novos itens aparecerão aqui automaticamente" },
  scheduled: { title: "Nenhuma visita programada", description: "Visitas programadas aparecerão aqui" },
};

interface MonitorColumnProps {
  title: string;
  status: MonitorStatus;
  users: ProcessedUser[];
  loading: boolean;
  onRegisterVisit: (userId: number) => Promise<void>;
  searchTerm?: string;
  isSelectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelection?: (userId: number) => void;
  onSelectAll?: (userIds: number[]) => void;
  onDeselectAll?: (userIds: number[]) => void;
  onLongPress?: (userId: number) => void;
}

export const MonitorColumn = memo(function MonitorColumn({
  title,
  status,
  users,
  loading,
  onRegisterVisit,
  searchTerm = "",
  isSelectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onLongPress,
}: MonitorColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const style = STATUS_STYLES[status];
  const Icon = STATUS_ICONS[status];

  const columnUserIds = useMemo(() => users.map((u) => u.id), [users]);
  const selectedInColumn = useMemo(() => columnUserIds.filter((id) => selectedIds.has(id)), [columnUserIds, selectedIds]);

  const isAllSelected = columnUserIds.length > 0 && selectedInColumn.length === columnUserIds.length;
  const isSomeSelected = selectedInColumn.length > 0 && !isAllSelected;
  const shouldAutoCollapse = !isDesktop && searchTerm && users.length === 0;
  const actuallyCollapsed = shouldAutoCollapse || isCollapsed;
  const checkboxStyle = isAllSelected ? style.checkbox : isSomeSelected ? style.checkboxPartial : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white";

  // RESPONSIVE FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // RESPONSIVE FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  return (
    <section className="flex flex-col flex-1 h-full">
      <div className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between rounded-t-lg border-b ${style.bg} ${style.border}`}>
        <div className="flex items-center gap-2.5">
          <AnimatePresence>
            {isSelectionMode && users.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                onClick={() => (isAllSelected ? onDeselectAll?.(columnUserIds) : onSelectAll?.(columnUserIds))}
                className={`flex h-6 w-6 items-center justify-center rounded transition-all mr-1 ${checkboxStyle}`}
              >
                {isAllSelected ? <CheckSquare className="h-4 w-4" strokeWidth={2.5} /> : isSomeSelected ? <Minus className="h-4 w-4" strokeWidth={2.5} /> : <Square className="h-4 w-4" />}
              </motion.button>
            )}
          </AnimatePresence>

          {status === "overdue" && users.length > 0 && !isSelectionMode && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
          <Icon className="w-5 h-5" strokeWidth={2.5} />
          <h2 className={`font-bold text-sm uppercase tracking-wider ${style.text}`}>{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isSelectionMode && selectedInColumn.length > 0 && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className={`text-xs font-medium ${style.text}`}>
                {selectedInColumn.length} sel.
              </motion.span>
            )}
          </AnimatePresence>

          <button onClick={() => setIsCollapsed(!isCollapsed)} className="md:hidden p-2 hover:bg-white/10 rounded transition-colors min-h-11 min-w-11">
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${actuallyCollapsed ? "" : "rotate-180"} ${style.text}`} />
          </button>

          <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.border} ${style.text} min-w-8 text-center`} role="status">
            <AnimatedCounter value={users.length} />
          </div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: actuallyCollapsed ? 0 : "auto", opacity: actuallyCollapsed ? 0 : 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`overflow-hidden bg-white/5 backdrop-blur-sm border-x border-b rounded-b-lg ${style.border}`}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: actuallyCollapsed ? 0 : "calc(100vh - 280px)" }} role={isSelectionMode ? "listbox" : "region"}>
          {loading ? (
            <SkeletonList count={3} />
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/50">
              <div className="relative mb-4">
                <Inbox className="w-20 h-20 text-white/20" strokeWidth={1.5} />
                {status === "overdue" && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-white/60 mb-1">{EMPTY_MESSAGES[status].title}</p>
              <p className="text-xs text-white/40 max-w-[200px] text-center">{EMPTY_MESSAGES[status].description}</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div key={user.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MonitorCard user={user} onRegisterVisit={onRegisterVisit} isSelectionMode={isSelectionMode} isSelected={selectedIds.has(user.id)} onToggleSelection={onToggleSelection} onLongPress={onLongPress} />
              </div>
            ))
          )}
        </div>
      </motion.div>
    </section>
  );
});
