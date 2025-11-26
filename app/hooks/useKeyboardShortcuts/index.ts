"use client";

import { useEffect, useRef } from "react";

interface KeyboardShortcutsConfig {
  onRefresh?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
}

const SHORTCUTS: Record<string, { cb: keyof KeyboardShortcutsConfig; mod: boolean }> = {
  r: { cb: "onRefresh", mod: true },
  k: { cb: "onSearch", mod: true },
  Escape: { cb: "onEscape", mod: false },
};

export function useKeyboardShortcuts(callbacks: KeyboardShortcutsConfig): void {
  const ref = useRef(callbacks);

  useEffect(() => { ref.current = callbacks; }, [callbacks]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = SHORTCUTS[e.key];
      if (!s || (s.mod && !(e.metaKey || e.ctrlKey))) return;
      if (s.mod) e.preventDefault();
      ref.current[s.cb]?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
