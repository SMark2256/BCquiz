'use client';

import { format } from 'date-fns';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Quiz } from '@/types';

interface QuizCardProps {
  quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const formattedDate = format(quiz.date, 'MM.dd');
  
  return (
    <Card className="overflow-hidden border-2 border-foreground bg-card transition-all hover:shadow-lg">
      <div className="flex">
        {/* Image Section */}
        <div className="relative size-32 shrink-0 bg-muted sm:size-40">
          {quiz.imageUrl ? (
            <Image
              src={quiz.imageUrl}
              alt={quiz.title}
              fill
              className="object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-secondary">
              <span className="text-3xl font-bold text-muted-foreground">
                {quiz.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div>
            {quiz.titleHu && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {quiz.titleHu}
              </p>
            )}
            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground sm:text-xl">
              {quiz.title}
            </h3>
            {quiz.category && (
              <Badge variant="secondary" className="mt-1">
                {quiz.category}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {quiz.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {quiz.location}
              </span>
            )}
          </div>
        </CardContent>

        {/* Date Section */}
        <div className="flex shrink-0 flex-col items-center justify-center border-l-2 border-foreground bg-foreground px-4 py-3 text-background">
          <div className="flex items-center gap-1 text-xs opacity-80">
            <Calendar className="size-3" />
          </div>
          <span className="text-2xl font-black sm:text-3xl">{formattedDate}</span>
          <div className="flex items-center gap-1 text-sm opacity-80">
            <Clock className="size-3" />
            <span>({quiz.time})</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
