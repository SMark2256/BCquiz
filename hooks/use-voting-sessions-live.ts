"use client";

import { useState, useEffect } from "react";
import { subscribeToVotingSessions } from "@/services/voting/voting-service";
import type { VotingSession } from "@/types";
import { isMockMode } from "@/services/mock-storage";
import { isFirebaseConfigured } from "@/lib/firebase";

export function useVotingSessionsLive() {
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const unsubscribe = subscribeToVotingSessions((updatedSessions) => {
        setSessions(updatedSessions);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error subscribing to voting sessions:", err);
      setError("Hiba a valós idejű frissítés során");
      setLoading(false);
    }
  }, []);

  const activeSession = sessions.find((s) => s.isActive) ?? null;

  return { sessions, activeSession, loading, error };
}
