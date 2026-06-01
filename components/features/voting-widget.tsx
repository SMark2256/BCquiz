'use client';

import { useVoting } from '@/hooks/use-voting';
import { VoteTopicCard } from './vote-topic-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LucideStar } from 'lucide-react';

export function VotingWidget() {
  const { topics, loading, error, vote, hasVoted, hasVotedAny } = useVoting();

  return (
    <div className="overflow-hidden rounded-xl border-2 border-foreground bg-gradient-to-b from-card to-card/50">
      {/* Header with gaming theme */}
      <div className="border-b-2 border-foreground bg-foreground px-4 py-3 text-background sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-background/20 sm:size-10">
            <LucideStar className="size-4 text-background sm:size-5" />
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
            Leadtad a szavazatod. Köszönjük a részvételt!
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg sm:h-28" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : topics.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center sm:p-8">
            <p className="text-sm text-muted-foreground sm:text-base">
              Jelenleg nincs elérhető téma szavazásra.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:gap-3">
            {topics.map((topic) => (
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
