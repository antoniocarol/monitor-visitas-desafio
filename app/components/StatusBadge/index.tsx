"use client";

import { memo } from "react";
import { MonitorStatus } from "../../types/monitor";
import { STATUS_STYLES } from "../../constants/statusStyles";
import { STATUS_ICONS } from "../../constants/statusIcons";

const getLabel = (status: MonitorStatus, days: number): string => {
  if (status === "overdue") return `${days}d atraso`;
  if (days === 0) return "HOJE";
  if (days === 1) return "Amanhã";
  return `em ${days}d`;
};

interface StatusBadgeProps {
  status: MonitorStatus;
  days: number;
}

export const StatusBadge = memo(function StatusBadge({ status, days }: StatusBadgeProps): React.JSX.Element {
  const style = STATUS_STYLES[status];
  const Icon = STATUS_ICONS[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold backdrop-blur-sm transition-all duration-300
        ${style.bgOpacity20} ${style.borderStrong} ${style.text} ${status === "urgent" ? "animate-pulse" : ""}`}
      role="status"
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
      <span>{getLabel(status, days)}</span>
    </div>
  );
});
