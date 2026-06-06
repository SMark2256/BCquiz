'use client';

import { useSyncExternalStore, useMemo } from 'react';
import {
  subscribeToStorage,
  getLocalVotingSessions,
} from '@/services/mock-storage';
import type { VotingSession } from '@/types';

// Cache the snapshot so useSyncExternalStore receives a stable reference
// between renders. getLocalVotingSessions() builds a fresh array on every
// call, which would otherwise trigger an infinite render loop. We only
// produce a new reference when the serialized data actually changes.
let cachedKey = '';
let cachedSessions: VotingSession[] = [];

function getSessionsSnapshot(): VotingSession[] {
  if (typeof window === 'undefined') return cachedSessions;

  const sessions = getLocalVotingSessions();
  const key = JSON.stringify(sessions);

  if (key !== cachedKey) {
    cachedKey = key;
    cachedSessions = sessions;
  }

  return cachedSessions;
}

function getServerSnapshot(): VotingSession[] {
  return [];
}

/**
 * Reactive list of all voting sessions, kept in sync with localStorage.
 * Re-renders automatically whenever a session is created, edited,
 * activated/deactivated, voted on, or reset.
 */
export function useVotingSessions(): VotingSession[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getSessionsSnapshot,
    getServerSnapshot
  );
}

/**
 * Reactive single active voting session (or null). Updates live whenever
 * a different session becomes active.
 */
export function useActiveVotingSession(): VotingSession | null {
  const sessions = useVotingSessions();

  const activeSession = useMemo(() => {
    return sessions.find(s => s.isActive) ?? null;
  }, [sessions]); // Függőség: csak akkor változik, ha a sessions változik

  return activeSession;
}
