"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchQuizzesDirectly } from "@/services/quiz/quiz-service";

const QUIZZES_STALE_TIME = 1000 * 60 * 5;

export function useQuizzes(
  upcomingOnly: boolean = false,
  staleTime: number = QUIZZES_STALE_TIME,
) {
  const {
    data: quizzes = [],
    isLoading: loading,
    isFetching: fetching,
    status,
    error,
    refetch,
  } = useQuery({
    queryKey: ["quizzes", { upcomingOnly }],
    queryFn: () => fetchQuizzesDirectly(upcomingOnly),
    staleTime,
    gcTime: QUIZZES_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    quizzes,
    loading,
    fetching,
    status,
    error:
      error instanceof Error ? error.message : error ? "Hiba történt" : null,
    refetch,
  };
}
