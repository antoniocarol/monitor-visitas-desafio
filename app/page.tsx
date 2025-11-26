"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, X } from "lucide-react";
import { MonitorStatus, ProcessedUser } from "./types/monitor";
import { SearchBar } from "./components/SearchBar";
import { MonitorColumn } from "./components/MonitorColumn";
import { ToastContainer } from "./components/Toast";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { EmptyState } from "./components/EmptyState";
import { SelectionActionBar } from "./components/SelectionActionBar";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { useMonitorData } from "./hooks/useMonitorData";
import { useToast } from "./hooks/useToast";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSelectionMode } from "./hooks/useSelectionMode";

const COLUMNS: { title: string; status: MonitorStatus; delay: number }[] = [
  { title: "ATRASADAS", status: "overdue", delay: 0 },
  { title: "URGENTES", status: "urgent", delay: 0.1 },
  { title: "PROGRAMADAS", status: "scheduled", delay: 0.2 },
];

const HEADER_BTN_CLASS = "flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white";

export default function Home(): React.JSX.Element {
  const { data, allUsers, loading, error, searchTerm, setSearchTerm, registerVisit, registerVisitBatch, refetch } = useMonitorData();
  const toast = useToast();
  const { isSelectionMode, selectedIds, selectedCount, enterSelectionMode, exitSelectionMode, toggleSelection, selectAll, deselectAll, clearSelection } = useSelectionMode();

  const [ariaMessage, setAriaMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedUsers = useMemo((): ProcessedUser[] => allUsers.filter(user => selectedIds.has(user.id)), [allUsers, selectedIds]);
  const totalResults = data.overdue.length + data.urgent.length + data.scheduled.length;
  const hasNoResults = !loading && searchTerm && totalResults === 0;

  // ACCESSIBILITY FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  useKeyboardShortcuts({
    onRefresh: refetch,
    onSearch: () => searchInputRef.current?.focus(),
    onEscape: () => isSelectionMode ? exitSelectionMode() : setSearchTerm(''),
  });

  const announce = useCallback((msg: string) => {
    setAriaMessage(msg);
    setTimeout(() => setAriaMessage(""), 1000);
  }, []);
  // ACCESSIBILITY FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  // VISIT REGISTRATION FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  const handleRegisterVisit = useCallback(async (userId: number) => {
    try {
      await registerVisit(userId);
      toast.success("Visita registrada com sucesso!");
    } catch {
      toast.error("Erro ao registrar visita. Tente novamente.");
    }
  }, [registerVisit, toast]);
  // VISIT REGISTRATION FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  // SELECTION MODE FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  const handleLongPress = useCallback((userId: number) => {
    enterSelectionMode(userId);
    announce("Modo seleção ativado");
  }, [enterSelectionMode, announce]);
  // SELECTION MODE FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  // BATCH CONFIRMATION MODAL FLUX >>>>>>>>>>>>>>>>>>>>>>>
  const handleOpenConfirmModal = useCallback(() => {
    if (selectedCount > 0) setIsModalOpen(true);
  }, [selectedCount]);

  const handleConfirmBatch = useCallback(async () => {
    if (selectedCount === 0) return;

    setIsBatchLoading(true);
    try {
      const userIds = Array.from(selectedIds);
      const results = await registerVisitBatch(userIds);

      if (results.failed.length === 0) {
        toast.success(`${results.success.length} visitas registradas com sucesso!`);
      } else if (results.success.length === 0) {
        toast.error("Erro ao registrar visitas. Tente novamente.");
      } else {
        toast.success(`${results.success.length} visitas registradas. ${results.failed.length} falharam.`);
      }

      setIsModalOpen(false);
      exitSelectionMode();
    } catch {
      toast.error("Erro ao registrar visitas. Tente novamente.");
    } finally {
      setIsBatchLoading(false);
    }
  }, [selectedIds, selectedCount, registerVisitBatch, toast, exitSelectionMode]);
  // BATCH CONFIRMATION MODAL FLUX <<<<<<<<<<<<<<<<<<<<<<<

  return (
    <div className="flex min-h-screen flex-col bg-zinc-900">
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 md:h-16 lg:h-16 w-full items-center justify-between px-4 md:px-6 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="font-inter text-xl md:text-2xl lg:text-3xl font-bold tracking-widest text-white/90">
            MONITOR
          </h1>
          <div className="hidden md:block">
            <ConnectionStatus />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.button
            key={isSelectionMode ? "cancel" : "select"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => isSelectionMode ? exitSelectionMode() : enterSelectionMode()}
            className={HEADER_BTN_CLASS}
          >
            {isSelectionMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSelectionMode ? "Cancelar" : "Selecionar"}</span>
          </motion.button>
        </AnimatePresence>
      </header>

      <div className="sr-only" role="status" aria-live="polite">{ariaMessage}</div>

      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      <SelectionActionBar
        selectedCount={selectedCount}
        isVisible={isSelectionMode && selectedCount > 0}
        loading={isBatchLoading}
        onConfirm={handleOpenConfirmModal}
        onClear={clearSelection}
        onCancel={exitSelectionMode}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        users={selectedUsers}
        loading={isBatchLoading}
        onConfirm={handleConfirmBatch}
        onCancel={() => setIsModalOpen(false)}
      />

      <main className={`flex-1 pt-14 md:pt-16 lg:pt-20 ${isSelectionMode && selectedCount > 0 ? 'pb-24' : ''}`}>
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          data={data}
          searchInputRef={searchInputRef}
        />

        {error && <ErrorDisplay error={error} onRetry={refetch} />}

        {hasNoResults ? (
          <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12">
            <EmptyState
              variant="search"
              title="Nenhum monitorado encontrado"
              description={`Não encontramos resultados para "${searchTerm}". Tente buscar por outro nome ou CPF.`}
              action={{
                label: "Limpar busca",
                onClick: () => setSearchTerm("")
              }}
            />
          </div>
        ) : (
          <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6">
            <div className="flex flex-col lg:flex-row lg:justify-center gap-6 xl:gap-8 2xl:gap-12">
              {COLUMNS.map(({ title, status, delay }) => (
                <motion.div
                  key={status}
                  className="w-full lg:w-auto lg:flex-1 lg:max-w-md xl:max-w-lg 2xl:max-w-xl lg:min-w-[380px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay }}
                >
                  <MonitorColumn
                    title={title}
                    status={status}
                    users={data[status]}
                    loading={loading}
                    onRegisterVisit={handleRegisterVisit}
                    searchTerm={searchTerm}
                    isSelectionMode={isSelectionMode}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    onSelectAll={selectAll}
                    onDeselectAll={deselectAll}
                    onLongPress={handleLongPress}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
