"use client";

import { useCallback, useEffect, useState } from "react";

/** Simple countdown used to throttle "resend code" buttons. */
export function useCooldown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);
  const start = useCallback((value = 60) => setSeconds(value), []);
  return { seconds, active: seconds > 0, start };
}
