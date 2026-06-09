"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVotingSessionsDirectly } from "@/services/voting/voting-service";

export const VOTING_SESSION_STALE_TIME = 10000;

export function useVotingSessions(
  staleTime: number = VOTING_SESSION_STALE_TIME,
) {
  const {
    data: sessions = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["voting_sessions"],
    queryFn: fetchVotingSessionsDirectly,
    staleTime,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return { sessions, loading: isLoading, isFetching, error };
}

export function useActiveVotingSession() {
  const { sessions, loading } = useVotingSessions();
  const activeSession = sessions.find((s) => s.isActive) ?? null;
  return { activeSession, loading };
}
