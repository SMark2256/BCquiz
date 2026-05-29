import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function QuizCardSkeleton() {
  return (
    <Card className="overflow-hidden border-2 border-muted">
      <div className="flex">
        {/* Image Section */}
        <Skeleton className="size-32 shrink-0 sm:size-40" />

        {/* Content Section */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <Skeleton className="mb-1 h-3 w-24" />
            <Skeleton className="h-6 w-32 sm:w-48" />
            <Skeleton className="mt-2 h-5 w-16" />
          </div>
          <Skeleton className="mt-3 h-4 w-28" />
        </div>

        {/* Date Section */}
        <div className="flex shrink-0 flex-col items-center justify-center px-4 py-3">
          <Skeleton className="mb-1 size-4" />
          <Skeleton className="h-8 w-16 sm:h-10" />
          <Skeleton className="mt-1 h-4 w-12" />
        </div>
      </div>
    </Card>
  );
}
