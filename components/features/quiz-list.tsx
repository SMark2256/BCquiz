'use client';

import { useQuizzes } from '@/hooks/use-quizzes';
import { QuizCard } from './quiz-card';
import { QuizCardSkeleton } from './quiz-card-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function QuizList() {
  const { quizzes, loading, error } = useQuizzes(true);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(1)].map((_, i) => (
          <QuizCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-muted-foreground/75 p-8 text-center">
        <p className="text-muted">Jelenleg nincs beütemezett kvízest.</p>
        <p className="mt-1 text-sm text-muted">Nézz vissza később!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
