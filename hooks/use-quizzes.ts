'use client';

import { useState, useEffect } from 'react';
import { subscribeToUpcomingQuizzes, subscribeToQuizzes } from '@/services/quiz-service';
import type { Quiz } from '@/types';

export function useQuizzes(upcomingOnly: boolean = false) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const subscribeFn = upcomingOnly ? subscribeToUpcomingQuizzes : subscribeToQuizzes;

    const unsubscribe = subscribeFn((data) => {
      setQuizzes(data);
      setLoading(false);
      setError(null);
    }, (err: any) => {
      console.error('Quiz subscription error:', err);
      setError('Hiba történt a kvízek betöltésekor.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [upcomingOnly]);

  return { quizzes, loading, error };
}
