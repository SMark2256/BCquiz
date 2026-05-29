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
    <div className="relative my-1">
      {/* Zigzag edge decorations using pseudo-elements with clip-path */}
      <div className="absolute -left-2 top-0 h-full w-4">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 16 100">
          <pattern id="zigzag-left" patternUnits="userSpaceOnUse" width="16" height="20">
            <path d="M16,0 L0,10 L16,20" fill="none" stroke="currentColor" strokeWidth="2" className="text-background"/>
            <path d="M16,0 L0,10 L16,20 L16,0" fill="currentColor" className="text-background"/>
          </pattern>
          <rect width="16" height="100%" fill="url(#zigzag-left)"/>
        </svg>
      </div>
      
      <div className="absolute -right-2 top-0 h-full w-4">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 16 100">
          <pattern id="zigzag-right" patternUnits="userSpaceOnUse" width="16" height="20">
            <path d="M0,0 L16,10 L0,20" fill="none" stroke="currentColor" strokeWidth="2" className="text-background"/>
            <path d="M0,0 L16,10 L0,20 L0,0" fill="currentColor" className="text-background"/>
          </pattern>
          <rect width="16" height="100%" fill="url(#zigzag-right)"/>
        </svg>
      </div>

      {/* Main ticket card */}
      <div className="flex h-24 items-stretch border-y-2 border-foreground bg-background sm:h-28">
        {/* Image Section */}
        <div className="relative h-full w-20 shrink-0 border-r-2 border-foreground bg-muted sm:w-24">
          {quiz.imageUrl ? (
            <Image
              src={quiz.imageUrl}
              alt={quiz.title}
              fill
              className="object-contain p-1"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="text-2xl font-black text-muted-foreground">
                {quiz.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Title Section */}
        <div className="flex flex-1 flex-col items-center justify-center px-3 py-2 text-center sm:px-4">
          {quiz.titleHu && (
            <p className="text-[0.6rem] font-bold uppercase leading-tight tracking-wide text-foreground sm:text-xs">
              {quiz.titleHu}
            </p>
          )}
          <h3 className="text-sm font-black uppercase leading-tight tracking-tight text-foreground sm:text-lg md:text-xl">
            {quiz.title}
          </h3>
          {quiz.category && (
            <p className="mt-0.5 text-[0.5rem] font-medium uppercase tracking-widest text-muted-foreground sm:text-[0.6rem]">
              ({quiz.category})
            </p>
          )}
        </div>

        {/* Date Section */}
        <div className="flex h-full w-16 shrink-0 flex-col items-center justify-center border-l-2 border-foreground bg-foreground text-background sm:w-20">
          <span className="text-xl font-black leading-none sm:text-2xl md:text-3xl">
            {month}.{day}
          </span>
          <span className="text-[0.6rem] font-bold sm:text-xs">
            ({quiz.time})
          </span>
        </div>
      </div>
    </div>
  );
}
