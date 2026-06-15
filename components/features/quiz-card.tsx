"use client";

import { useState, useEffect } from "react";
import { QuizCardSkeleton } from "./quiz-card-skeleton";
import { format } from "date-fns";
import Image from "next/image";
import type { Quiz } from "@/types";
import { cn } from "@/lib/utils";

interface QuizCardProps {
  quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const day = format(quiz.date, "dd");
  const month = format(quiz.date, "MM");

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
          {/* Image Section */}
          {/*<div className="relative flex shrink-0 items-stretch">*/}
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
          {/*</div>*/}

          {/* Title Section */}
          <div className="flex flex-1 flex-col items-center justify-center px-3 text-center">
            {quiz.titleHu && (
              <p className="text-sm font-bold uppercase leading-tight tracking-wide text-background sm:text-sm">
                {quiz.titleHu}
              </p>
            )}
            <h3 className="text-base font-black uppercase leading-tight tracking-tight text-background sm:text-lg md:text-xl tracking-wider">
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
              {/* Belső dekorációs pöttyök - A sötét blokk sarkaiban, szintén fekete szegéllyel */}
              {/*<div className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-foreground"/>*/}
              {/*<div className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-foreground"/>*/}
              {/*<div className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full bg-foreground"/>*/}
              {/*<div className="absolute -bottom-1.5 -right-1.5 size-3 rounded-full bg-foreground"/>*/}

              <span className="text-xl font-black leading-none tracking-wider md:text-2xl">
                {month}.{day}
              </span>
              <span className="text-[0.6rem] font-bold sm:text-xs">
                ({quiz.time})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
