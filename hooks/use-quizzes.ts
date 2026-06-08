"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchQuizzesDirectly } from "@/services/quiz/quiz-service";

export function useQuizzes(upcomingOnly: boolean = false) {
  const {
    data: quizzes = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["quizzes", { upcomingOnly }],
    queryFn: () => fetchQuizzesDirectly(upcomingOnly),
    staleTime: 1000 * 60 * 60 * 24, // 24 óra: eddig nem indít új kérést, ha van adat
    gcTime: 1000 * 60 * 60 * 24, // 24 óra: eddig tartja meg a memóriában
  });

  return {
    quizzes,
    loading,
    error:
      error instanceof Error ? error.message : error ? "Hiba történt" : null,
    refetch,
  };
}
