"use client";

import { formatDate } from "../../utils/dateCalculations";

interface DateDisplayProps {
  date: Date;
  relativeText: string;
  className?: string;
}

export function DateDisplay({ date, relativeText, className = "" }: DateDisplayProps) {
  return (
    <span
      className={`relative inline-block ${className}`}
      title={formatDate(date)}
    >
      {relativeText}
    </span>
  );
}
