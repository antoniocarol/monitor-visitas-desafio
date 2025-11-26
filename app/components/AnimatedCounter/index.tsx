"use client";

import { useEffect, useState, useRef } from "react";

const ANIMATION_DURATION_MS = 300;

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export function AnimatedCounter({ value, className = "" }: AnimatedCounterProps): React.JSX.Element {
  const [displayValue, setDisplayValue] = useState(value);

  const requestRef = useRef<number>(0);

  // COUNTER ANIMATION FLUX >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  useEffect(() => {
    const start = displayValue;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (start !== end) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [value, displayValue]);
  // COUNTER ANIMATION FLUX <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  return (
    <span
      className={`transition-all duration-300 ${className}`}
      style={{ transform: displayValue !== value ? "scale(1.1)" : "scale(1)" }}
    >
      {displayValue}
    </span>
  );
}
