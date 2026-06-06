'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  isMockMode,
  getLocalQuizzes,
  getLocalUpcomingQuizzes,
  createLocalQuiz,
  updateLocalQuiz,
  deleteLocalQuiz,
  resetLocalData,
  subscribeToStorage,
  notifyStorageChange,
} from '@/services/mock-storage';
import type { Quiz, QuizFormData, ApiResponse } from '@/types';

// Get snapshot for useSyncExternalStore
function getQuizzesSnapshot(): Quiz[] {
  if (typeof window === 'undefined') return [];
  return getLocalQuizzes();
}

function getUpcomingQuizzesSnapshot(): Quiz[] {
  if (typeof window === 'undefined') return [];
  return getLocalUpcomingQuizzes();
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
