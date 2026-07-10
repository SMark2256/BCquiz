"use client";

import { useState, useEffect } from "react";
import { QuizCardSkeleton } from "./quiz-card-skeleton";
import { format, isSameDay } from "date-fns";
import Image from "next/image";
import type { Quiz } from "@/types";
import { cn } from "@/lib/utils";
import MythicText from "@/components/ui/mythic-text";

interface QuizCardProps {
  quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const quizTime: string = format(quiz.date, "MM.dd");
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const isToday: boolean = isSameDay(new Date(), quiz.date);

  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!quiz.imageUrl) {
      setImageLoaded(true);
    }
  }, [quiz.imageUrl]);

  return (
    <div className="relative">
      {!imageLoaded && <QuizCardSkeleton />}

      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-white/10 transition-all quiz-cards",
          !imageLoaded
            ? "opacity-0"
            : "opacity-100 transition-opacity duration-300",
        )}
      >
        {/*
        A kártya külső kerete p-[3px] paddinggel és border-y-2 szegéllyel,
        hogy meglegyen a vizuális távolság a szélektől.
      */}

        <div className="relative flex z-50 h-30 items-stretch text-white sm:h-32">
          {quiz.imageUrl ? (
            <div className="relative min-w-26 w-auto max-w-32 overflow-hidden">
              <Image
                src={quiz.imageUrl}
                alt={quiz.title}
                fill
                width={0}
                height={0}
                className="object-cover"
                sizes="(max-width: 768px) 96px, 112px"
                crossOrigin="anonymous"
                style={{ imageRendering: "crisp-edges" }}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center bg-muted/20">
              <span className="text-2xl font-black text-muted-foreground">
                {quiz.title.charAt(0)}
              </span>
            </div>
          )}

          {/* Title Section */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-3 text-center">
            {quiz.titleHu && (
              <p className="text-xs font-medium uppercase leading-tight tracking-wide text-background sm:text-sm">
                {quiz.titleHu}
              </p>
            )}
            <h3 className="text-base sm:text-xl font-black uppercase leading-tight text-background tracking-wider w-full line-clamp-3 wrap-break-word">
              {quiz.title}
            </h3>
            {quiz.category && (
              <p className="mt-0.5 text-[0.6rem] font-medium uppercase tracking-widest text-muted">
                ({quiz.category})
              </p>
            )}
          </div>

          {/* Date Section - Double border & Corner Dots */}
          <div className="relative flex h-full w-20 shrink-0 flex-col items-center justify-center border-foreground py-3 sm:py-4 mr-3 sm:mr-4 sm:w-24">
            {/* Belső sötét doboz */}
            <div className="relative flex size-full flex-col items-center justify-center bg-muted/0 text-muted">
              {isToday ? (
                <MythicText>
                  <span className="text-xl font-black leading-none tracking-wider md:text-xl">
                    MA
                  </span>
                </MythicText>
              ) : (
                <span className="text-xl font-black leading-none tracking-wider md:text-xl">
                  {quizTime}
                </span>
              )}
              <span className="text-base font-bold sm:text-md tracking-wider">
                ({quiz.time})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
