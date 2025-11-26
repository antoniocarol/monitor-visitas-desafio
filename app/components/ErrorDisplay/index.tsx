"use client";

import { ApiError } from "../../types/monitor";

interface ErrorDisplayProps {
  error: ApiError | string;
  onRetry?: () => void;
}

const ERROR_CONFIG: Record<string, { icon: string; title: string }> = {
  network: { icon: "🌐", title: "Erro de Conexão" },
  timeout: { icon: "⏱️", title: "Tempo Esgotado" },
  server: { icon: "🔧", title: "Erro no Servidor" },
  validation: { icon: "⚠️", title: "Dados Inválidos" },
  unknown: { icon: "❌", title: "Erro ao Carregar Dados" },
};

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps): React.JSX.Element {
  const apiError: ApiError = typeof error === "string"
    ? { type: "unknown", message: error, userMessage: error, canRetry: true }
    : error;

  const { icon, title } = ERROR_CONFIG[apiError.type] || ERROR_CONFIG.unknown;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div
        className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 backdrop-blur-md flex items-start gap-4"
        role="alert"
        aria-live="assertive"
      >
        <span className="text-4xl shrink-0" aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-red-100 font-bold text-lg mb-2">{title}</h3>
          <p className="text-red-100/90 text-sm mb-4 wrap-break-word">{apiError.userMessage}</p>
          {apiError.canRetry && onRetry ? (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 border border-red-500 rounded-md text-red-100 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              aria-label="Tentar carregar dados novamente"
            >
              🔄 Tentar Novamente
            </button>
          ) : (
            <p className="text-red-100/60 text-xs mt-2">Entre em contato com o suporte se o problema persistir</p>
          )}
        </div>
      </div>
    </div>
  );
}
