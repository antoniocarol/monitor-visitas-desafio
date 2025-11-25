import { MonitoredUser, ProcessedUser, MonitorStatus } from "../types/monitor";
import { formatDistanceToNow, differenceInHours, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { URGENT_THRESHOLD_DAYS } from "../constants/config";

const MS_PER_DAY = 86400000;

export function parseApiDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString.replace(/\//g, "-").replace(" ", "T"));
  return isNaN(date.getTime()) ? null : date;
}

export function determineStatus(daysRemaining: number): MonitorStatus {
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= URGENT_THRESHOLD_DAYS) return "urgent";
  return "scheduled";
}

export function processUser(user: MonitoredUser, now = new Date()): ProcessedUser | null {
  if (user.verify_frequency_in_days <= 0) return null;

  const lastVerifiedDateObj = parseApiDate(user.last_verified_date);
  if (!lastVerifiedDateObj) return null;

  const nextVisitDate = new Date(lastVerifiedDateObj);
  nextVisitDate.setDate(nextVisitDate.getDate() + user.verify_frequency_in_days);

  const daysDiff = Math.ceil((nextVisitDate.getTime() - now.getTime()) / MS_PER_DAY);

  return {
    ...user,
    status: determineStatus(daysDiff),
    nextVisitDate,
    lastVerifiedDateObj,
    cpfDigits: user.cpf.replace(/\D/g, ""),
    nameLower: user.name.toLowerCase(),
    daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : 0,
    daysRemaining: daysDiff >= 0 ? daysDiff : 0,
  };
}

export function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatCPF(cpf: string): string {
  const c = cpf.replace(/\D/g, "");
  return c.length === 11 ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : cpf;
}

export const sortOverdue = (users: ProcessedUser[]) =>
  [...users].sort((a, b) => b.daysOverdue - a.daysOverdue);

export const sortUrgent = (users: ProcessedUser[]) =>
  [...users].sort((a, b) => a.daysRemaining - b.daysRemaining);

export const sortScheduled = (users: ProcessedUser[]) =>
  [...users].sort((a, b) => a.nextVisitDate.getTime() - b.nextVisitDate.getTime());

export function formatNextVisitRelative(nextVisitDate: Date, daysRemaining: number): string {
  if (daysRemaining === 0) return "hoje";
  if (daysRemaining === 1) return "amanhã";
  if (daysRemaining === 2) return "em 2 dias";
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d atrás`;
  return `em ${daysRemaining}d`;
}

export function formatLastVisitRelative(lastVisitDate: Date): string {
  if (isToday(lastVisitDate)) return "hoje";
  if (isYesterday(lastVisitDate)) return "ontem";
  const hoursDiff = differenceInHours(new Date(), lastVisitDate);
  if (hoursDiff < 24) return `há ${hoursDiff}h`;
  return formatDistanceToNow(lastVisitDate, { addSuffix: true, locale: ptBR });
}

export const formatDateForApi = (date: Date): string =>
  date.toISOString().replace("T", " ").slice(0, 19).replace(/-/g, "/");
