"use client";

import { CheckCircle2 } from "lucide-react";
import { FacebookIcon } from "@/components/ui/social-links";
import Image from "next/image";
import type { VoteTopic } from "@/types";

interface VoteDoneBoxProps {
  votedTopic?: VoteTopic | null;
}

export function VoteDoneBox({ votedTopic }: VoteDoneBoxProps) {
  return (
    <div className="flex flex-col bg-foreground text-background p-3 gap-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tight text-background">
            Köszönjük a szavazatod!
          </h2>
        </div>

        {/* Megszavazott téma kártya */}
        {votedTopic && (
          <div className="flex w-full md:w-3/4 items-center gap-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 p-2">
            {votedTopic.imageUrl && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={votedTopic.imageUrl}
                  alt={votedTopic.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <span className="flex text-base font-black text-background leading-tight">
              {votedTopic.title}
            </span>
          </div>
        )}

        <span className="text-center text-background/80 w-full md:w-5/6">
          A szavazás eredményéről a Facebook oldalunkon fogunk tájékoztatni!
        </span>
      </div>
      <div className="flex justify-center items-center">
        <a
          href="https://www.facebook.com/barcraftbudapest/upcoming_hosted_events"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-auto items-center justify-center gap-2 rounded-md border-2 border-white/20 bg-[#1877F2] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#166fe5]"
        >
          <FacebookIcon className="h-6 w-6 sm:h-5 sm:w-5" />
          Facebook Események
        </a>
      </div>
    </div>
  );
}
