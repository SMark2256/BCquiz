"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVotingSessionsDirectly } from "@/services/voting/voting-service";

export function useVotingSessions() {
  const {
    data: sessions = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["voting_sessions"],
    queryFn: fetchVotingSessionsDirectly,
    staleTime: 1000 * 60 * 10, // 10 perc
    gcTime: 1000 * 60 * 60 * 24,
  });

  return { sessions, loading, error };
}

export function useActiveVotingSession() {
  const { sessions, loading } = useVotingSessions();
  const activeSession = sessions.find((s) => s.isActive) ?? null;
  return { activeSession, loading };
}
