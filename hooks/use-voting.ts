'use client';

import { useState, useEffect, useCallback } from 'react';
import { getVoteTopics, voteForTopic } from '@/services/vote-service';
import type { VoteTopic } from '@/types';

export function useVoting() {
  const [topics, setTopics] = useState<VoteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedTopics, setVotedTopics] = useState<Set<string>>(new Set());

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await getVoteTopics();
    
    if (result.success && result.data) {
      setTopics(result.data);
    } else {
      setError(result.error || 'Failed to fetch topics');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTopics();
    
    // Load voted topics from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('votedTopics');
      if (saved) {
        setVotedTopics(new Set(JSON.parse(saved)));
      }
    }
  }, [fetchTopics]);

  const vote = async (topicId: string) => {
    if (votedTopics.has(topicId)) {
      return { success: false, error: 'Already voted for this topic' };
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
      
      // Save to localStorage
      const newVotedTopics = new Set(votedTopics).add(topicId);
      setVotedTopics(newVotedTopics);
      localStorage.setItem('votedTopics', JSON.stringify([...newVotedTopics]));
    }
    
    return result;
  };

  const hasVoted = (topicId: string) => votedTopics.has(topicId);

  return { topics, loading, error, vote, hasVoted, refetch: fetchTopics };
}
