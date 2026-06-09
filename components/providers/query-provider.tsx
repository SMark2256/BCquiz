"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, useEffect, useMemo } from "react";

const STALE_TIME = 1000 * 60 * 10; // 10 perc
const CACHE_KEY = "QUERY_CACHE";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // A QueryClient-et csak egyszer hozzuk létre
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME,
            gcTime: 1000 * 60 * 60 * 24,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );

  // A persister-t memoizáljuk, hogy ne jöjjön létre minden renderelésnél
  const persister = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: CACHE_KEY,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });
  }, []);

  useEffect(() => {
    setMounted(true);

    // Logolás csak egyszer, az igazi betöltődés után
    const logCacheStatus = () => {
      const rawCache = localStorage.getItem(CACHE_KEY);
      if (!rawCache) return;

      try {
        const cache = JSON.parse(rawCache);
        const now = Date.now();
        console.groupCollapsed("🕒 Cache Időzítés Ellenőrzése (Részletek)");
        cache.clientState.queries.forEach((query: any) => {
          const updatedAt = query.state.dataUpdatedAt;
          if (updatedAt > 0) {
            const timeLeftMs = STALE_TIME - (now - updatedAt);
            if (timeLeftMs > 0) {
              const min = Math.floor(timeLeftMs / 60000);
              const sec = Math.floor((timeLeftMs % 60000) / 1000);
              console.log(
                `✅ ${JSON.stringify(query.queryKey)}: ${min}p ${sec}mp`,
              );
            }
          }
        });
        console.groupEnd();
      } catch (e) {}
    };

    // Kis késleltetés, hogy a hidratáció biztosan befejeződjön
    const timer = setTimeout(logCacheStatus, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Ha még nem mountolódott, akkor is adjuk vissza a gyerekeit egy alap Provider-ben,
  // hogy elkerüljük a teljes alkalmazás villogását/re-mountolását
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: persister as any }}
      onSuccess={() => {
        // Itt is lehetne logolni a sikeres hidratációt
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
