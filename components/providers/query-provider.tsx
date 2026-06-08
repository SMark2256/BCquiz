"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, useEffect } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60 * 24, // 24 óra
            gcTime: 1000 * 60 * 60 * 24, // 24 óra
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
        },
      }),
  );

  // Csak a kliens oldalon mountolás után engedélyezzük a perzisztenciát
  useEffect(() => {
    setMounted(true);
  }, []);

  // Persister beállítása - itt már biztosak lehetünk a window meglétében
  const persister =
    typeof window !== "undefined"
      ? createSyncStoragePersister({
          storage: window.localStorage,
        })
      : undefined;

  // Amíg a szerveren vagyunk, vagy nem mountolódott a kliens, sima Provider-t adunk vissza
  if (!mounted || !persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  // Kliens oldalon, ha már van persister, használjuk a perzisztens verziót
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
