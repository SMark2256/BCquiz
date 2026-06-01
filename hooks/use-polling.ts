'use client';

import { useState, useEffect, useCallback } from 'react';
import { getActivePolls, voteForPollOption } from '@/services/poll-service';
import type { Poll, PollOption } from '@/types';

const VOTE_STORAGE_KEY = 'bcquiz_poll_votes';

interface VoteRecord {
  pollId: string;
  optionId: string;
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

export function usePolling() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteRecords, setVoteRecords] = useState<Record<string, VoteRecord>>({});
  const [fingerprint, setFingerprint] = useState<string>('');

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await getActivePolls();
    
    if (result.success && result.data) {
      setPolls(result.data);
    } else {
      setError(result.error || 'Nem sikerült betölteni a szavazásokat');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolls();
    
    // Generate fingerprint
    const fp = generateFingerprint();
    setFingerprint(fp);
    
    // Load vote records from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VOTE_STORAGE_KEY);
      if (saved) {
        try {
          const records = JSON.parse(saved) as Record<string, VoteRecord>;
          // Verify fingerprints match
          const validRecords: Record<string, VoteRecord> = {};
          Object.entries(records).forEach(([pollId, record]) => {
            if (record.fingerprint === fp) {
              validRecords[pollId] = record;
            }
          });
          setVoteRecords(validRecords);
          
          // Update localStorage with only valid records
          if (Object.keys(validRecords).length !== Object.keys(records).length) {
            localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(validRecords));
          }
        } catch {
          localStorage.removeItem(VOTE_STORAGE_KEY);
        }
      }
    }
  }, [fetchPolls]);

  const vote = async (pollId: string, optionId: string): Promise<{ success: boolean; error?: string }> => {
    // Check if user has already voted on this poll
    if (voteRecords[pollId]) {
      return { success: false, error: 'Már leadtad a szavazatod erre a szavazásra.' };
    }

    const result = await voteForPollOption(pollId, optionId);
    
    if (result.success && result.data) {
      // Update local state optimistically
      setPolls(prev => 
        prev.map(poll => 
          poll.id === pollId 
            ? result.data!
            : poll
        )
      );
      
      // Create permanent vote record
      const newRecord: VoteRecord = {
        pollId,
        optionId,
        timestamp: Date.now(),
        fingerprint,
      };
      
      const newRecords = { ...voteRecords, [pollId]: newRecord };
      setVoteRecords(newRecords);
      
      // Save to localStorage
      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(newRecords));
    }
    
    return result;
  };

  const hasVotedOnPoll = (pollId: string) => !!voteRecords[pollId];
  const getVotedOption = (pollId: string) => voteRecords[pollId]?.optionId;
  
  // Get sorted options for a poll (by votes, descending)
  const getSortedOptions = (poll: Poll): PollOption[] => {
    return Object.values(poll.options).sort((a, b) => b.votes - a.votes);
  };

  // Get total votes for a poll
  const getTotalVotes = (poll: Poll): number => {
    return Object.values(poll.options).reduce((sum, opt) => sum + opt.votes, 0);
  };

  return { 
    polls, 
    loading, 
    error, 
    vote, 
    hasVotedOnPoll,
    getVotedOption,
    getSortedOptions,
    getTotalVotes,
    refetch: fetchPolls 
  };
}

// Keep backward compatibility - alias for the old hook name
export const useVoting = usePolling;
