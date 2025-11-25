"use client";

import { LucideIcon, Search } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "search";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default"
}: EmptyStateProps) {
  const DefaultIcon = variant === "search" ? Search : Icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-white/50">
      {DefaultIcon && (
        <div className="relative mb-4">
          <DefaultIcon className="w-20 h-20 text-white/20" strokeWidth={1.5} />
        </div>
      )}

      <h3 className="text-base font-semibold text-white/70 mb-2 text-center">
        {title}
      </h3>

      <p className="text-sm text-white/40 max-w-[280px] text-center mb-4">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white/90 hover:text-white transition-all duration-200 text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
