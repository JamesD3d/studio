
"use client";
import { useState, useEffect, useCallback } from "react";

const MOBILE_BREAKPOINT = 768; // Standard tablet breakpoint (md in Tailwind)

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  const checkDevice = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  useEffect(() => {
    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener("resize", checkDevice);

    // Cleanup listener
    return () => window.removeEventListener("resize", checkDevice);
  }, [checkDevice]);

  return isMobile;
}
