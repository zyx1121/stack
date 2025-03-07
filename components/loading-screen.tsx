"use client";

import { useHydration } from "@/hooks/use-hydration";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function LoadingScreen() {
  const isHydrated = useHydration();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="h-16 w-16 animate-spin rounded-full border-1 border-t-2 border-primary" />
    </div>
  );
}
