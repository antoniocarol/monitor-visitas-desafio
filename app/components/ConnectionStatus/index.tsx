"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const CONNECTION_CHECK_INTERVAL_MS = 5000;

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = "" }: ConnectionStatusProps): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const checkConnection = async () => {
      const start = Date.now();
      try {
        const response = await fetch(API_URL, {
          method: 'HEAD',
          cache: 'no-cache',
        });

        if (response.ok) {
          const responseTime = Date.now() - start;
          setLatency(responseTime);
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch {
        setIsOnline(false);
        setLatency(0);
      }
    };

    checkConnection();

    const interval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL_MS);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkConnection();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full border
        ${isOnline
          ? 'bg-emerald-500/20 border-emerald-500/50'
          : 'bg-red-500/20 border-red-500/50'
        }
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label={isOnline ? `Conectado, latência ${latency}ms` : 'Desconectado'}
    >
      <div className="relative w-2 h-2">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        )}
        <span className={`absolute inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
      </div>

      {isOnline ? (
        <Wifi className="w-3.5 h-3.5 text-emerald-100" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-red-100" strokeWidth={2.5} aria-hidden="true" />
      )}

      <span className={`text-xs font-bold ${isOnline ? 'text-emerald-100' : 'text-red-100'}`}>
        {isOnline ? 'AO VIVO' : 'OFFLINE'}
      </span>

      {isOnline && latency > 0 && (
        <span className="text-xs text-emerald-200/70 font-mono">
          {latency}ms
        </span>
      )}
    </div>
  );
}
