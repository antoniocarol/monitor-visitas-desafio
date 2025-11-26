"use client";

import { RefObject } from "react";
import { Search, X, AlertCircle, Clock, CheckCircle, LucideIcon } from "lucide-react";
import { MonitorColumnData, MonitorStatus } from "../../types/monitor";
import { AnimatedCounter } from "../AnimatedCounter";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  data: MonitorColumnData;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

const BADGES: { status: MonitorStatus; Icon: LucideIcon; label: string; colors: string }[] = [
  { status: "overdue", Icon: AlertCircle, label: "atrasadas", colors: "bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-100" },
  { status: "urgent", Icon: Clock, label: "urgentes", colors: "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30 text-yellow-100" },
  { status: "scheduled", Icon: CheckCircle, label: "programadas", colors: "bg-green-500/20 border-green-500/50 hover:bg-green-500/30 text-green-100" },
];

export function SearchBar({ searchTerm, onSearchChange, data, searchInputRef }: SearchBarProps): React.JSX.Element {
  const totalResults = data.overdue.length + data.urgent.length + data.scheduled.length;

  return (
    <div className="w-full mx-auto px-4 py-3 lg:py-4 bg-zinc-900/98 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200 font-medium text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors p-1 hover:bg-white/10 rounded min-h-11 min-w-11 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchTerm && (
          <p className="text-sm text-white/70 text-center md:text-left">
            <span className="font-semibold text-white/95">{totalResults}</span> {totalResults === 1 ? 'monitorado encontrado' : 'monitorados encontrados'}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
          {BADGES.map(({ status, Icon, label, colors }) => (
            <div key={status} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${colors}`}>
              <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
              <AnimatedCounter value={data[status].length} className="font-bold text-sm" />
              <span className="sr-only">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
