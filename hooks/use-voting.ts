'use client';

import { useState, useEffect, useCallback } from 'react';
import { getVoteTopics, voteForTopic } from '@/services/vote-service';
import type { VoteTopic } from '@/types';

const VOTE_STORAGE_KEY = 'bcquiz_vote_record';

interface VoteRecord {
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
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function useVoting() {
  const [topics, setTopics] = useState<VoteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await getVoteTopics();
    
    if (result.success && result.data) {
      setTopics(result.data);
    } else {
      setError(result.error || 'Nem sikerült betölteni a témákat');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTopics();
    
    // Generate fingerprint
    const fp = generateFingerprint();
    setFingerprint(fp);
    
    // Load vote record from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VOTE_STORAGE_KEY);
      if (saved) {
        try {
          const record = JSON.parse(saved) as VoteRecord;
          // Verify fingerprint matches (basic anti-tampering)
          if (record.fingerprint === fp) {
            setVoteRecord(record);
          } else {
            // Fingerprint mismatch - could be tampering, keep the vote locked
            // but don't restore the old record
            localStorage.removeItem(VOTE_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(VOTE_STORAGE_KEY);
        }
      }
    }
  }, [fetchTopics]);

  const vote = async (topicId: string): Promise<{ success: boolean; error?: string }> => {
    // Check if user has already voted
    if (voteRecord) {
      return { success: false, error: 'Már leadtad a szavazatod. Nem lehet módosítani.' };
    }

    const result = await voteForTopic(topicId);
    
    if (result.success) {
      // Update local state optimistically
      setTopics(prev => 
        prev.map(topic => 
          topic.id === topicId 
            ? { ...topic, votes: topic.votes + 1 }
            : topic
        ).sort((a, b) => b.votes - a.votes)
      );
      
      // Create permanent vote record
      const newRecord: VoteRecord = {
        topicId,
        timestamp: Date.now(),
        fingerprint,
      };
      
      setVoteRecord(newRecord);
      
      // Save to localStorage with fingerprint for verification
      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(newRecord));
    }
    
    return result;
  };

  const hasVoted = (topicId: string) => voteRecord?.topicId === topicId;
  const hasVotedAny = voteRecord !== null;

  return { 
    topics, 
    loading, 
    error, 
    vote, 
    hasVoted, 
    hasVotedAny,
    refetch: fetchTopics 
  };
}
