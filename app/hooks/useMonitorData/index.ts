"use client";

import { useState, useEffect, useCallback, useMemo, useOptimistic, startTransition } from "react";
import { MonitoredUser, ProcessedUser, MonitorColumnData, ApiError } from "../../types/monitor";
import { processUser, sortOverdue, sortUrgent, sortScheduled, formatDateForApi } from "../../utils/dateCalculations";
import { useDebounce } from "../useDebounce";
import { API_URL, FETCH_TIMEOUT_MS, DEBOUNCE_DELAY_MS } from "../../constants/config";

interface UseMonitorDataReturn {
  data: MonitorColumnData;
  allUsers: ProcessedUser[];
  loading: boolean;
  error: ApiError | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  registerVisit: (userId: number) => Promise<void>;
  registerVisitBatch: (userIds: number[]) => Promise<{ success: number[]; failed: number[] }>;
  refetch: () => Promise<void>;
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeout = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error instanceof Error && error.name === "AbortError" ? new Error("TIMEOUT") : error;
  }
}

function handleFetchError(error: unknown, response?: Response): ApiError {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const msg = errorObj.message;

  if (msg === "TIMEOUT") return { type: "timeout", message: "Request timeout", userMessage: "O tempo de conexão esgotou. Verifique sua internet.", canRetry: true, originalError: errorObj };
  if (!response || msg === "Failed to fetch") return { type: "network", message: "Network error", userMessage: "Não foi possível conectar ao servidor. Verifique sua conexão.", canRetry: true, originalError: errorObj };
  if (response.status >= 500) return { type: "server", message: `Server error: ${response.status}`, userMessage: "O servidor está temporariamente indisponível.", canRetry: true, originalError: errorObj };
  if (response.status === 404) return { type: "server", message: "Resource not found", userMessage: "Os dados solicitados não foram encontrados.", canRetry: false, originalError: errorObj };
  return { type: "unknown", message: msg || "Unknown error", userMessage: "Ocorreu um erro inesperado. Tente novamente.", canRetry: true, originalError: errorObj };
}

export function useMonitorData(): UseMonitorDataReturn {
  const [rawData, setRawData] = useState<ProcessedUser[]>([]);
  const [optimisticData, setOptimisticData] = useOptimistic<ProcessedUser[], { userId: number; date: string; now: Date }>(
    rawData,
    (state, { userId, date, now }) => {
      return state.map((user) => {
        if (user.id !== userId) return user;

        const updated: MonitoredUser = {
          ...user,
          last_verified_date: date,
        };
        const processed = processUser(updated, now);
        return processed || user;
      });
    }
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY_MS);

  const fetchData = useCallback(async () => {
    let response: Response | undefined;
    try {
      setLoading(true);
      setError(null);

      response = await fetchWithTimeout(API_URL);

      if (!response.ok) {
        const apiError = handleFetchError(new Error(`HTTP ${response.status}`), response);
        setError(apiError);
        return;
      }

      const users: MonitoredUser[] = await response.json();

      const now = new Date();
      const processed = users
        .filter((user) => user.active)
        .map((user) => processUser(user, now))
        .filter((user): user is ProcessedUser => user !== null);

      setRawData(processed);
    } catch (err) {
      setError(handleFetchError(err, response));
    } finally {
      setLoading(false);
    }
  }, []);

  const registerVisit = useCallback(async (userId: number) => {
    let response: Response | undefined;

    try {
      const now = new Date();
      const formattedDate = formatDateForApi(now);

      setOptimisticData({ userId, date: formattedDate, now });

      response = await fetchWithTimeout(`${API_URL}/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_verified_date: formattedDate,
        }),
      });

      if (!response.ok) {
        const apiError = handleFetchError(
          new Error(`HTTP ${response.status}`),
          response
        );
        throw apiError;
      }

      await fetchData();
    } catch (err) {
      throw err instanceof Error ? err : handleFetchError(err, response);
    }
  }, [fetchData, setOptimisticData]);

  const registerVisitBatch = useCallback(async (userIds: number[]): Promise<{ success: number[]; failed: number[] }> => {
    const now = new Date();
    const formattedDate = formatDateForApi(now);

    const results = { success: [] as number[], failed: [] as number[] };

    startTransition(() => {
      for (const userId of userIds) {
        setOptimisticData({ userId, date: formattedDate, now });
      }
    });

    const promises = userIds.map(async (userId) => {
      try {
        const response = await fetchWithTimeout(`${API_URL}/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            last_verified_date: formattedDate,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return { userId, success: true };
      } catch {
        return { userId, success: false };
      }
    });

    const settled = await Promise.all(promises);
    results.success = settled.filter(r => r.success).map(r => r.userId);
    results.failed = settled.filter(r => !r.success).map(r => r.userId);

    await fetchData();
    return results;
  }, [fetchData, setOptimisticData]);

  const filteredAndCategorizedData = useMemo((): MonitorColumnData => {
    let dataToProcess = optimisticData;

    if (debouncedSearchTerm) {
      const isNumericSearch = /^\d+$/.test(debouncedSearchTerm);
      const searchLower = debouncedSearchTerm.toLowerCase();

      dataToProcess = optimisticData.filter((user) => {
        if (isNumericSearch) {
          return user.cpfDigits.includes(debouncedSearchTerm);
        }
        return user.nameLower.includes(searchLower);
      });
    }

    const categorized = {
      overdue: [] as ProcessedUser[],
      urgent: [] as ProcessedUser[],
      scheduled: [] as ProcessedUser[],
    };

    for (const user of dataToProcess) {
      categorized[user.status].push(user);
    }

    return {
      overdue: sortOverdue(categorized.overdue),
      urgent: sortUrgent(categorized.urgent),
      scheduled: sortScheduled(categorized.scheduled),
    };
  }, [optimisticData, debouncedSearchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: filteredAndCategorizedData,
    allUsers: optimisticData,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    registerVisit,
    registerVisitBatch,
    refetch: fetchData,
  };
}
