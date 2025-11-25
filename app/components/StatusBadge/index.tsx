import { memo } from "react";
import { MonitorStatus } from "../../types/monitor";
import { STATUS_STYLES } from "../../constants/statusStyles";
import { STATUS_ICONS } from "../../constants/statusIcons";

interface StatusBadgeProps {
  status: MonitorStatus;
  days: number;
}

export const StatusBadge = memo(function StatusBadge({ status, days }: StatusBadgeProps): React.JSX.Element {
  const style = STATUS_STYLES[status];
  const Icon = STATUS_ICONS[status];

  const label =
    status === "overdue" ? `${days}d atraso` :
    days === 0 ? "Hoje" :
    days === 1 ? "Amanhã" :
    `${days}d`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold backdrop-blur-sm transition-all duration-300
        ${style.bgOpacity20} ${style.borderStrong} ${style.text} ${status === "urgent" ? "animate-pulse" : ""}`}
      role="status"
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
});
