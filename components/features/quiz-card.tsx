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
      {/* Mobile: Stack vertically, Desktop: Horizontal */}
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative h-40 w-full shrink-0 bg-muted sm:h-auto sm:w-32 md:w-40">
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
          {/* Mobile: Date overlay on image */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-background sm:hidden">
            <Calendar className="size-3" />
            <span className="text-sm font-bold">{formattedDate}</span>
            <span className="text-xs opacity-80">({quiz.time})</span>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="flex flex-1 flex-col justify-between p-3 sm:p-4">
          <div>
            {quiz.titleHu && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {quiz.titleHu}
              </p>
            )}
            <h3 className="text-base font-bold uppercase tracking-tight text-foreground sm:text-lg md:text-xl">
              {quiz.title}
            </h3>
            {quiz.category && (
              <Badge variant="secondary" className="mt-1">
                {quiz.category}
              </Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:mt-3 sm:gap-3 sm:text-sm">
            {quiz.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {quiz.location}
              </span>
            )}
            {/* Mobile: Show time inline */}
            <span className="flex items-center gap-1 sm:hidden">
              <Clock className="size-3" />
              {quiz.time}
            </span>
          </div>
        </CardContent>

        {/* Date Section - Desktop only */}
        <div className="hidden shrink-0 flex-col items-center justify-center border-l-2 border-foreground bg-foreground px-3 py-3 text-background sm:flex md:px-4">
          <div className="flex items-center gap-1 text-xs opacity-80">
            <Calendar className="size-3" />
          </div>
          <span className="text-xl font-black md:text-3xl">{formattedDate}</span>
          <div className="flex items-center gap-1 text-xs opacity-80 md:text-sm">
            <Clock className="size-3" />
            <span>({quiz.time})</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
