import { MonitorStatus } from "../types/monitor";

export const STATUS_STYLES: Record<MonitorStatus, {
  bg: string;
  bgOpacity20: string;
  border: string;
  borderStrong: string;
  text: string;
  textAccent: string;
  checkbox: string;
  checkboxPartial: string;
}> = {
  overdue: {
    bg: "bg-red-500/10",
    bgOpacity20: "bg-red-500/20",
    border: "border-red-500/30",
    borderStrong: "border-red-500/50",
    text: "text-red-100",
    textAccent: "text-red-400",
    checkbox: "bg-red-500 text-white",
    checkboxPartial: "bg-red-500/50 text-white",
  },
  urgent: {
    bg: "bg-yellow-500/10",
    bgOpacity20: "bg-yellow-500/20",
    border: "border-yellow-500/30",
    borderStrong: "border-yellow-500/50",
    text: "text-yellow-100",
    textAccent: "text-yellow-400",
    checkbox: "bg-yellow-500 text-black",
    checkboxPartial: "bg-yellow-500/50 text-black",
  },
  scheduled: {
    bg: "bg-green-500/10",
    bgOpacity20: "bg-green-500/20",
    border: "border-green-500/30",
    borderStrong: "border-green-500/50",
    text: "text-green-100",
    textAccent: "text-emerald-400",
    checkbox: "bg-emerald-500 text-white",
    checkboxPartial: "bg-emerald-500/50 text-white",
  },
};

export const getStatusLabel = (status: MonitorStatus, days: number): string => {
  if (status === "overdue") return `${days}d atraso`;
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days}d`;
};
