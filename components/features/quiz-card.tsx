'use client';

import { format } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';
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
      <Card className="rounded-none border-[4px] border-zinc-700 bg-zinc-950 shadow-none transition-colors hover:border-zinc-500 group">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section - Visual 'Punch-out' */}
          <div className="relative h-48 w-full shrink-0 border-zinc-700 bg-zinc-900 sm:h-auto sm:w-32 sm:border-r-[4px] md:w-40">
            {quiz.imageUrl ? (
                <Image
                    src={quiz.imageUrl}
                    alt={quiz.title}
                    fill
                    className="object-contain p-2"
                    crossOrigin="anonymous"
                />
            ) : (
                <div className="flex size-full items-center justify-center bg-zinc-900">
              <span className="text-3xl font-bold text-zinc-700">
                {quiz.title.charAt(0)}
              </span>
                </div>
            )}
            {/* Mobile: Date overlay - Stamp feel */}
            <div className="absolute bottom-0 right-0 border-l-[4px] border-t-[4px] border-zinc-700 bg-black px-3 py-1 text-zinc-100 sm:hidden">
              <span className="text-sm font-black tracking-tighter">{formattedDate}</span>
              <span className="ml-2 text-[0.65rem] font-bold text-zinc-400 uppercase">{quiz.time}</span>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="flex flex-1 flex-col justify-center p-4 sm:p-6">
            <div className="space-y-1">
              {quiz.titleHu && (
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {quiz.titleHu}
                  </p>
              )}
              <h3 className="text-xl font-bold uppercase tracking-[0.05em] text-zinc-100 sm:text-2xl">
                {quiz.title}
              </h3>
              {quiz.category && (
                  <Badge variant="outline" className="mt-2 rounded-none border-zinc-700 bg-zinc-900 text-[0.6rem] uppercase tracking-widest text-zinc-400 font-mono">
                    {quiz.category}
                  </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-zinc-500">
              {quiz.location && (
                  <span className="flex items-center gap-1.5">
                <MapPin className="size-3 text-zinc-600" />
                    {quiz.location}
              </span>
              )}
              <span className="flex items-center gap-1.5 sm:hidden">
              <Clock className="size-3 text-zinc-600" />
                {quiz.time}
            </span>
            </div>
          </CardContent>

          {/* Refined Date/Time 'Stamp' (The Right Side) */}
          <div className="hidden shrink-0 flex-col items-center justify-center border-l-[4px] border-zinc-700 bg-zinc-900/50 p-4 sm:flex min-w-[130px]">
            <div className="flex flex-col items-center justify-center border-[3px] border-zinc-600 bg-black px-4 py-3 min-w-[100px] shadow-inner">
              <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Dátum</span>
              <span className="text-3xl font-black tracking-tighter text-zinc-100 leading-none">{formattedDate}</span>
              <div className="mt-2 flex items-center gap-1.5 border-t-[2px] border-zinc-800 pt-2 w-full justify-center">
                <Clock className="size-3 text-zinc-500" />
                <span className="text-xs font-black text-zinc-100 tracking-wide">{quiz.time}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
  );
}
