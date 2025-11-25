"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export function AnimatedCounter({ value, className = "" }: AnimatedCounterProps): React.JSX.Element {
  const [displayValue, setDisplayValue] = useState(value);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const start = displayValue;
    const end = value;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

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

  return (
    <span
      className={`transition-all duration-300 ${className}`}
      style={{
        transform: displayValue !== value ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      {displayValue}
    </span>
  );
}
