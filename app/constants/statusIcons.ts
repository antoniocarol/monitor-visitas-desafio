import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { MonitorStatus } from "../types/monitor";

export const STATUS_ICONS = {
  overdue: AlertCircle,
  urgent: Clock,
  scheduled: CheckCircle,
} as const satisfies Record<MonitorStatus, typeof AlertCircle>;
