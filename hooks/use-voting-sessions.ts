"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVotingSessions, subscribeToVotingSessions } from "@/services/voting/voting-service";

export const VOTING_SESSION_STALE_TIME = 10000;

export function useVotingSessions(
  staleTime: number = VOTING_SESSION_STALE_TIME,
) {
  const queryClient = useQueryClient();

  // Use react-query for the initial state and caching
  const {
    data: sessions = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["voting_sessions"],
    queryFn: async () => {
      const response = await getVotingSessions();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    staleTime,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToVotingSessions((updatedSessions) => {
      // Update the query cache whenever we get new data from Firebase/Mock
      queryClient.setQueryData(["voting_sessions"], updatedSessions);
    });

    return () => unsubscribe();
  }, [queryClient]);

  return { sessions, loading: isLoading, isFetching, error };
}

export function useActiveVotingSession() {
  const { sessions, loading } = useVotingSessions();
  const activeSession = sessions.find((s) => s.isActive) ?? null;
  return { activeSession, loading };
}
