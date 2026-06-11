"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, useMemo } from "react";

const STALE_TIME = 1000 * 60 * 10; // 10 perc
const CACHE_KEY = "QUERY_CACHE";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // A QueryClient-et csak egyszer hozzuk létre
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME,
            gcTime: STALE_TIME,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: true,
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
