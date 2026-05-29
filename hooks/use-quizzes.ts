'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUpcomingQuizzes, getQuizzes } from '@/services/quiz-service';
import type { Quiz } from '@/types';

export function useQuizzes(upcomingOnly: boolean = false) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = upcomingOnly 
      ? await getUpcomingQuizzes() 
      : await getQuizzes();
    
    if (result.success && result.data) {
      setQuizzes(result.data);
    } else {
      setError(result.error || 'Failed to fetch quizzes');
    }
    
    setLoading(false);
  }, [upcomingOnly]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return { quizzes, loading, error, refetch: fetchQuizzes };
}
