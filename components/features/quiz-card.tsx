'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import type { Quiz } from '@/types';
import { cn } from "@/lib/utils";

interface QuizCardProps {
    quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
    const day = format(quiz.date, 'dd');
    const month = format(quiz.date, 'MM');

    return (
        <div className='relative overflow-hidden rounded-lg border-2 border-foreground transition-all'>
            {/*
        A kártya külső kerete p-[3px] paddinggel és border-y-2 szegéllyel,
        hogy meglegyen a vizuális távolság a szélektől.
      */ }

            <div
                className="relative flex z-50 h-24 items-stretch bg-background sm:h-28">
                {/* Image Section */ }
                <div className="relative flex shrink-0 items-stretch">
                    { quiz.imageUrl ? (
                        <div className="relative w-24 overflow-hidden sm:w-28">
                            <Image
                                src={ quiz.imageUrl }
                                alt={ quiz.title }
                                fill
                                className="object-cover"
                                crossOrigin="anonymous"
                            />
                        </div>
                    ) : (
                        <div className="flex size-full items-center justify-center">
                              <span className="text-2xl font-black text-muted-foreground">
                                { quiz.title.charAt(0) }
                              </span>
                        </div>
                    ) }
                </div>

                {/* Title Section */ }
                <div className="flex flex-1 flex-col items-center justify-center px-3 text-center">
                    { quiz.titleHu && (
                        <p className="text-[0.6rem] font-bold uppercase leading-tight tracking-wide text-foreground sm:text-xs">
                            { quiz.titleHu }
                        </p>
                    ) }
                    <h3 className="text-sm font-black uppercase leading-tight tracking-tight text-foreground sm:text-lg md:text-xl">
                        { quiz.title }
                    </h3>
                    { quiz.category && (
                        <p className="mt-0.5 text-[0.5rem] font-medium uppercase tracking-widest text-muted-foreground sm:text-[0.6rem]">
                            ({ quiz.category })
                        </p>
                    ) }
                </div>

                {/* Date Section - Double border & Corner Dots */ }
                <div
                    className="relative flex h-full w-20 shrink-0 flex-col items-center justify-center border-foreground py-2 mr-2 sm:w-24">


                    {/* Belső sötét doboz */ }
                    <div
                        className="relative flex size-full flex-col items-center justify-center border-1 border-foreground bg-foreground text-background">
                        {/* Belső dekorációs pöttyök - A sötét blokk sarkaiban, szintén fekete szegéllyel */ }
                        <div className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-background"/>
                        <div className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-background"/>
                        <div className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full bg-background"/>
                        <div className="absolute -bottom-1.5 -right-1.5 size-3 rounded-full bg-background"/>

                        <span className="text-xl font-black leading-none md:text-2xl">
                { month }.{ day }
              </span>
                        <span className="text-[0.6rem] font-bold sm:text-xs">
                ({ quiz.time })
              </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
