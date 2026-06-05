'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToUpcomingQuizzes, subscribeToQuizzes } from '@/services/quiz-service';
import type { Quiz } from '@/types';

export function useQuizzes(upcomingOnly: boolean = false) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Az upcomingOnly flag alapján a megfelelő szolgáltatást hívjuk meg
    const subscribeFn = upcomingOnly ? subscribeToUpcomingQuizzes : subscribeToQuizzes;

    const unsubscribe = subscribeFn((data) => {
      setQuizzes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [upcomingOnly]);

  return { quizzes, loading };
}
