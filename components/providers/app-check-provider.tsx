"use client";

import { useEffect } from "react";
import { initAppCheck } from "@/lib/firebase";

export function AppCheckProvider() {
  useEffect(() => {
    // 3 másodperces késleltetés a betöltés optimalizáláshoz
    const timer = setTimeout(() => {
      initAppCheck().catch(console.error);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
