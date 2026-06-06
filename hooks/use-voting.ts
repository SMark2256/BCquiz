'use client';

import { useState, useEffect, useCallback } from 'react';
import { getActiveVotingSession, voteForVoteTopic } from '@/services/voting-service';
import type { VoteTopic } from '@/types';

const VOTE_STORAGE_KEY = 'bcquiz_vote_record';

interface VoteRecord {
  sessionId: string;
  topicId: string;
  timestamp: number;
  fingerprint: string;
}

// Generate a simple browser fingerprint to help prevent vote manipulation
function generateFingerprint(): string {
  if (typeof window === 'undefined') return 'server';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }

  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function useVoting() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topics, setTopics] = useState<VoteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');

  // Load the single active voting session and its votepool.
  const fetchActiveSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getActiveVotingSession();

    if (result.success) {
      const session = result.data;
      setSessionId(session?.id ?? null);
      setTopics(
        session ? [...session.votepool].sort((a, b) => b.votes - a.votes) : []
      );
    } else {
      setError(result.error || 'Nem sikerült betölteni a szavazást');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActiveSession();

    const fp = generateFingerprint();
    setFingerprint(fp);

    // Restore the persisted vote record (basic anti-tampering via fingerprint).
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VOTE_STORAGE_KEY);
      if (saved) {
        try {
          const record = JSON.parse(saved) as VoteRecord;
          if (record.fingerprint === fp) {
            setVoteRecord(record);
          } else {
            localStorage.removeItem(VOTE_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(VOTE_STORAGE_KEY);
        }
      }
    }
  }, [fetchActiveSession]);

  const vote = async (topicId: string): Promise<{ success: boolean; error?: string }> => {
    if (!sessionId) {
      return { success: false, error: 'Nincs aktív szavazás' };
    }

    // One vote per active session.
    if (voteRecord && voteRecord.sessionId === sessionId) {
      return { success: false, error: 'Már leadtad a szavazatod erre a szavazásra.' };
    }

    // Optimistic update.
    const previousTopics = [...topics];
    setTopics(prev =>
      prev
        .map(topic => (topic.id === topicId ? { ...topic, votes: topic.votes + 1 } : topic))
        .sort((a, b) => b.votes - a.votes)
    );

    const result = await voteForVoteTopic(sessionId, topicId);

    if (!result.success) {
      // Rollback on failure.
      setTopics(previousTopics);
      setError(result.error || 'Hiba a szavazat leadásakor');
      return { success: false, error: result.error || 'Hiba a szavazat leadásakor' };
    }

    // Persist the vote record so the user stays locked after a reload.
    const newRecord: VoteRecord = { sessionId, topicId, timestamp: Date.now(), fingerprint };
    setVoteRecord(newRecord);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(newRecord));
    }

    // Re-sync with the latest aggregated counts.
    fetchActiveSession();
    return { success: true };
  };

  const hasVoted = (topicId: string) =>
    voteRecord?.sessionId === sessionId && voteRecord?.topicId === topicId;
  const hasVotedAny = voteRecord?.sessionId === sessionId && voteRecord !== null;

  return {
    topics,
    loading,
    error,
    vote,
    hasVoted,
    hasVotedAny,
    refetch: fetchActiveSession,
  };
}
