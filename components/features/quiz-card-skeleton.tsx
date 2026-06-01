import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function QuizCardSkeleton() {
  return (
      <div className="relative overflow-hidden rounded-lg border-2 border-foreground bg-gray-800/50 transition-all">
        <div className="relative flex z-50 h-24 items-stretch sm:h-28">
          {/* Kép helye */}
          <Skeleton className="w-24 shrink-0 sm:w-28 rounded-none" />

          {/* Szöveges tartalom */}
          <div className="flex flex-1 flex-col items-center justify-center px-3 text-center">
            <Skeleton className="h-3 w-20 mb-2 opacity-50" /> {/* titleHu helye */}
            <Skeleton className="h-6 w-32 sm:w-48" />        {/* Főcím helye */}
            <Skeleton className="mt-2 h-3 w-16 opacity-30" /> {/* Kategória helye */}
          </div>

          {/* Dátum szekció */}
          <div className="flex h-full w-20 shrink-0 flex-col items-center justify-center px-3 sm:w-24">
            <Skeleton className="h-8 w-12 rounded-sm" />
            <Skeleton className="mt-1 h-3 w-8 opacity-50" />
          </div>
        </div>
      </div>
  );
}
