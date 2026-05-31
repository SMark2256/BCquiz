'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import type { Quiz } from '@/types';

interface QuizCardProps {
  quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const day = format(quiz.date, 'dd');
  const month = format(quiz.date, 'MM');

  return (
    <div className="border-x-2 border-t-2 last:border-b-2 border-foreground bg-background">
      {/* Inner container with padding */}
      <div className="flex h-20 items-stretch p-1 sm:h-24 sm:p-1.5">
        {/* Image Section */}
        <div className="relative h-full w-16 shrink-0 overflow-hidden sm:w-20">
          {quiz.imageUrl ? (
            <Image
              src={quiz.imageUrl}
              alt={quiz.title}
              fill
              className="object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <span className="text-xl font-black text-muted-foreground">
                {quiz.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Title Section */}
        <div className="flex flex-1 flex-col items-center justify-center px-2 text-center sm:px-4">
          {quiz.titleHu && (
            <p className="text-[0.5rem] font-bold uppercase leading-tight tracking-wide text-foreground sm:text-[0.65rem]">
              {quiz.titleHu}
            </p>
          )}
          <h3 className="text-xs font-black uppercase leading-tight tracking-tight text-foreground sm:text-base md:text-lg">
            {quiz.title}
          </h3>
          {quiz.category && (
            <p className="mt-0.5 text-[0.45rem] font-medium uppercase tracking-widest text-muted-foreground sm:text-[0.55rem]">
              ({quiz.category})
            </p>
          )}
        </div>

        {/* Date Section with double border and corner circles */}
        <div className="relative flex h-full w-14 shrink-0 items-center justify-center bg-background p-1 sm:w-16 sm:p-1.5">
          {/* Outer border */}
          <div className="relative flex size-full items-center justify-center border border-foreground">
            {/* Inner dark box */}
            <div className="relative flex size-[calc(100%-4px)] flex-col items-center justify-center bg-foreground text-background sm:size-[calc(100%-6px)]">
              {/* Corner circles - background colored to create punch-hole effect */}
              <div className="absolute -left-1 -top-1 size-2 rounded-full bg-background sm:size-2.5" />
              <div className="absolute -right-1 -top-1 size-2 rounded-full bg-background sm:size-2.5" />
              <div className="absolute -bottom-1 -left-1 size-2 rounded-full bg-background sm:size-2.5" />
              <div className="absolute -bottom-1 -right-1 size-2 rounded-full bg-background sm:size-2.5" />

              <span className="text-base font-black leading-none sm:text-xl">
                {month}.{day}
              </span>
              <span className="text-[0.5rem] font-bold sm:text-[0.6rem]">
                ({quiz.time})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
