'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  isMockMode,
  getLocalQuizzes,
  getLocalUpcomingQuizzes,
  getLocalVoteTopics,
  createLocalQuiz,
  updateLocalQuiz,
  deleteLocalQuiz,
  createLocalVoteTopic,
  updateLocalVoteTopic,
  deleteLocalVoteTopic,
  incrementLocalVote,
  resetLocalData,
} from '@/services/mock-storage';
import type { Quiz, QuizFormData, VoteTopic, VoteTopicFormData, ApiResponse } from '@/types';

// Create a simple event emitter for storage changes
const storageListeners = new Set<() => void>();

function notifyStorageChange() {
  storageListeners.forEach(listener => listener());
}

function subscribeToStorage(callback: () => void) {
  storageListeners.add(callback);
  return () => storageListeners.delete(callback);
}

// Get snapshot for useSyncExternalStore
function getQuizzesSnapshot(): Quiz[] {
  if (typeof window === 'undefined') return [];
  return getLocalQuizzes();
}

function getUpcomingQuizzesSnapshot(): Quiz[] {
  if (typeof window === 'undefined') return [];
  return getLocalUpcomingQuizzes();
}

function getVoteTopicsSnapshot(): VoteTopic[] {
  if (typeof window === 'undefined') return [];
  return getLocalVoteTopics();
}

// Server snapshot (empty arrays for SSR)
function getServerSnapshot(): never[] {
  return [];
}

/**
 * Hook to manage quizzes with localStorage persistence
 * Provides reactive updates when data changes
 */
export function useMockQuizzes(upcomingOnly: boolean = false) {
  const quizzes = useSyncExternalStore(
    subscribeToStorage,
    upcomingOnly ? getUpcomingQuizzesSnapshot : getQuizzesSnapshot,
    getServerSnapshot
  );

  const createQuiz = useCallback((data: QuizFormData): ApiResponse<Quiz> => {
    const result = createLocalQuiz(data);
    if (result.success) notifyStorageChange();
    return result;
  }, []);

  const updateQuiz = useCallback((id: string, data: Partial<QuizFormData>): ApiResponse<Quiz> => {
    const result = updateLocalQuiz(id, data);
    if (result.success) notifyStorageChange();
    return result;
  }, []);

  const deleteQuiz = useCallback((id: string): ApiResponse<void> => {
    const result = deleteLocalQuiz(id);
    if (result.success) notifyStorageChange();
    return result;
  }, []);

  const refresh = useCallback(() => {
    notifyStorageChange();
  }, []);

  return {
    quizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    refresh,
    isMockMode: isMockMode(),
  };
}

/**
 * Hook to manage vote topics with localStorage persistence
 * Provides reactive updates when data changes
 */
export function useMockVoteTopics() {
  const topics = useSyncExternalStore(
    subscribeToStorage,
    getVoteTopicsSnapshot,
    getServerSnapshot
  );

  const createTopic = useCallback((data: VoteTopicFormData): ApiResponse<VoteTopic> => {
    const result = createLocalVoteTopic(data);
    if (result.success) notifyStorageChange();
    return result;
  }, []);

  const updateTopic = useCallback((id: string, data: Partial<VoteTopicFormData>): ApiResponse<VoteTopic> => {
    const result = updateLocalVoteTopic(id, data);
    if (result.success) notifyStorageChange();
    return result;
  }, []);

  const deleteTopic = useCallback((id: string): ApiResponse<void> => {
    const result = deleteLocalVoteTopic(id);
    if (result.success) notifyStorageChange();
    return result;
  }, []);

  const vote = useCallback((topicId: string): ApiResponse<VoteTopic> => {
    const result = incrementLocalVote(topicId);
    if (result.success) notifyStorageChange();
    return result;
  }, []);

  const refresh = useCallback(() => {
    notifyStorageChange();
  }, []);

  return {
    topics,
    createTopic,
    updateTopic,
    deleteTopic,
    vote,
    refresh,
    isMockMode: isMockMode(),
  };
}

/**
 * Hook to check and display mock mode status
 */
export function useMockStatus() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const reset = useCallback(() => {
    resetLocalData();
    notifyStorageChange();
  }, []);

  return {
    isMockMode: isClient && isMockMode(),
    isClient,
    resetData: reset,
  };
}

/**
 * Utility to manually trigger storage refresh
 * Useful when data is modified outside of hooks
 */
export function triggerStorageRefresh() {
  notifyStorageChange();
}
