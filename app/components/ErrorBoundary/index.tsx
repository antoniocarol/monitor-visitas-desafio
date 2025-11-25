"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("ErrorBoundary capturou erro:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4">
          <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Algo deu errado
            </h1>
            <p className="text-white/60 mb-6 text-sm">
              {this.state.error?.message || "Ocorreu um erro inesperado na aplicação"}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20
                       border border-white/20 rounded-md text-white
                       font-medium transition-colors duration-200"
            >
              🔄 Recarregar Página
            </button>
            <p className="text-white/40 text-xs mt-4">
              Se o problema persistir, entre em contato com o suporte
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
