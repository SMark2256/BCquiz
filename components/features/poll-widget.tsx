'use client';

import { usePolling } from '@/hooks/use-polling';
import { PollOptionCard } from './poll-option-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trophy } from 'lucide-react';
import type { Poll } from '@/types';

interface PollCardProps {
  poll: Poll;
  vote: (pollId: string, optionId: string) => Promise<{ success: boolean; error?: string }>;
  hasVotedOnPoll: (pollId: string) => boolean;
  getVotedOption: (pollId: string) => string | undefined;
  getSortedOptions: (poll: Poll) => import('@/types').PollOption[];
  getTotalVotes: (poll: Poll) => number;
}

function PollCard({
  poll,
  vote,
  hasVotedOnPoll,
  getVotedOption,
  getSortedOptions,
  getTotalVotes,
}: PollCardProps) {
  const hasVoted = hasVotedOnPoll(poll.id);
  const votedOptionId = getVotedOption(poll.id);
  const sortedOptions = getSortedOptions(poll);
  const totalVotes = getTotalVotes(poll);

  return (
    <div className="overflow-hidden rounded-xl border-2 border-foreground bg-gradient-to-b from-card to-card/50">
      {/* Header */}
      <div className="border-b-2 border-foreground bg-foreground px-4 py-3 text-background sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-background/20 sm:size-10">
            <Trophy className="size-4 text-background sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black uppercase tracking-tight sm:text-lg">
              {poll.title}
            </h2>
            {poll.description && (
              <p className="truncate text-xs text-background/70 sm:text-sm">
                {poll.description}
              </p>
            )}
          </div>
        </div>
        
        {hasVoted && (
          <div className="mt-3 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-300 sm:text-sm">
            Leadtad a szavazatod. Köszönjük a részvételt!
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        {sortedOptions.map((option) => (
          <PollOptionCard
            key={option.id}
            option={option}
            totalVotes={totalVotes}
            onVote={() => vote(poll.id, option.id)}
            hasVoted={hasVoted}
            isVotedOption={votedOptionId === option.id}
            disabled={hasVoted}
          />
        ))}
      </div>
    </div>
  );
}

export function PollWidget() {
  const { 
    polls, 
    loading, 
    error, 
    vote, 
    hasVotedOnPoll, 
    getVotedOption,
    getSortedOptions,
    getTotalVotes,
  } = usePolling();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(1)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border-2 border-border">
            <Skeleton className="h-20 w-full" />
            <div className="space-y-3 p-4">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border-2 border-foreground bg-gradient-to-b from-card to-card/50">
        <div className="border-b-2 border-foreground bg-foreground px-4 py-3 text-background sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-background/20 sm:size-10">
              <Trophy className="size-4 text-background sm:size-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight sm:text-lg">
                Szavazás
              </h2>
              <p className="text-xs text-background/70 sm:text-sm">
                Hamarosan új szavazások!
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center sm:p-8">
          <p className="text-sm text-muted-foreground sm:text-base">
            Jelenleg nincs aktív szavazás.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          vote={vote}
          hasVotedOnPoll={hasVotedOnPoll}
          getVotedOption={getVotedOption}
          getSortedOptions={getSortedOptions}
          getTotalVotes={getTotalVotes}
        />
      ))}
    </div>
  );
}
