export interface MonitoredUser {
  id: number;
  name: string;
  cpf: string;
  active: boolean;
  last_verified_date: string;
  verify_frequency_in_days: number;
}

export type MonitorStatus = "overdue" | "urgent" | "scheduled";

export interface ProcessedUser extends MonitoredUser {
  status: MonitorStatus;
  nextVisitDate: Date;
  lastVerifiedDateObj: Date;
  cpfDigits: string;
  nameLower: string;
  daysOverdue: number;
  daysRemaining: number;
}

export interface MonitorColumnData {
  overdue: ProcessedUser[];
  urgent: ProcessedUser[];
  scheduled: ProcessedUser[];
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

export type ErrorType = "network" | "server" | "timeout" | "validation" | "unknown";

export interface ApiError {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  originalError?: Error;
}
