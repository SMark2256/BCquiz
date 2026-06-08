"use client";

import { useVoting } from "@/hooks/use-voting";
import { VoteTopicCard } from "./vote-topic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LucideStar } from "lucide-react";
import MythicIcon from "@/components/ui/mythic-icon";

export function VotingWidget() {
  const { topics, loading, error, vote, hasVoted, hasVotedAny } = useVoting();

  return (
    <div className="overflow-hidden rounded-xl border-2 border-white/10 bg-foreground p-1">
      {/* Header with gaming theme */}
      <div className="border-b-2 border-foreground px-4 py-3 text-background sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-background/15 sm:size-10">
            <MythicIcon>
              <LucideStar className="size-4 text-background sm:size-5" />
            </MythicIcon>
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight sm:text-lg">
              Szavazz a Következő Kvízest Témára
            </h2>
            <p className="text-xs text-background/70 sm:text-sm">
              Segíts eldönteni, miről szóljon a következő kvízest!
            </p>
          </div>
        </div>

        {hasVotedAny && (
          <div className="mt-3 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-300 sm:text-sm">
            Köszönjük, hogy szavaztál! Az eredmények hamarosan várhatóak!
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-lg border-2 border-foreground bg-gray-800/50 transition-all"
              >
                <div className="relative flex z-50 h-24 items-stretch sm:h-28">
                  <Skeleton className="w-24 shrink-0 sm:w-28 rounded-none" />
                  <div className="flex flex-1 flex-col items-start justify-center px-3 text-center">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 opacity-50" />
                  </div>
                  <div className="flex items-center px-3">
                    <Skeleton className="h-9 w-24 rounded-md shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : topics.length === 0 || error ? (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/75 p-6 text-center sm:p-8">
            <p className="text-sm text-muted sm:text-base">
              Jelenleg nincs elérhető téma szavazásra.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {topics?.map((topic) => (
              <VoteTopicCard
                key={topic.id}
                topic={topic}
                onVote={vote}
                hasVoted={hasVoted(topic.id)}
                hasVotedAny={hasVotedAny}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
