'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ThumbsUp, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { VoteTopic } from '@/types';

interface VoteTopicCardProps {
  topic: VoteTopic;
  onVote: (topicId: string) => Promise<{ success: boolean; error?: string }>;
  hasVoted: boolean;
  hasVotedAny: boolean;
  rank: number;
}

export function VoteTopicCard({ topic, onVote, hasVoted, hasVotedAny, rank }: VoteTopicCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (hasVotedAny || isVoting) return;
    
    setIsVoting(true);
    await onVote(topic.id);
    setIsVoting(false);
  };

  const isDisabled = hasVotedAny || isVoting;

  return (
    <Card className={cn(
      "overflow-hidden border transition-all",
      hasVoted ? "border-primary bg-primary/5" : hasVotedAny ? "opacity-60" : "hover:border-primary/50"
    )}>
      <CardContent className="p-2 sm:p-3">
        {/* Mobile: 2-row layout, Desktop: single row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* Top row on mobile / Left side on desktop */}
          <div className="flex items-center gap-3 sm:flex-1">
            {/* Rank */}
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold sm:size-8 sm:text-sm">
              {rank}
            </div>

            {/* Image */}
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted sm:size-12">
              {topic.imageUrl ? (
                <Image
                  src={topic.imageUrl}
                  alt={topic.title}
                  fill
                  className="object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-secondary">
                  <span className="text-sm font-bold text-muted-foreground sm:text-lg">
                    {topic.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="truncate text-sm font-semibold text-foreground sm:text-base">{topic.title}</h4>
              {topic.description && (
                <p className="truncate text-xs text-muted-foreground">{topic.description}</p>
              )}
            </div>
          </div>

          {/* Bottom row on mobile / Right side on desktop */}
          <div className="flex items-center justify-between gap-3 pl-10 sm:justify-end sm:gap-4 sm:pl-0">
            {/* Vote Count */}
            <div className="text-left sm:text-right">
              <span className="text-base font-bold text-foreground sm:text-lg">{topic.votes}</span>
              <p className="text-xs text-muted-foreground">szavazat</p>
            </div>

            {/* Vote Button */}
            <Button
              variant={hasVoted ? "secondary" : hasVotedAny ? "outline" : "default"}
              size="sm"
              onClick={handleVote}
              disabled={isDisabled}
              className="shrink-0 text-xs sm:text-sm"
            >
              {hasVoted ? (
                <>
                  <Check data-icon="inline-start" />
                  <span className="hidden xs:inline">Szavaztál</span>
                  <span className="xs:hidden">OK</span>
                </>
              ) : hasVotedAny ? (
                <>
                  <Lock data-icon="inline-start" />
                  <span className="hidden xs:inline">Lezárva</span>
                </>
              ) : (
                <>
                  <ThumbsUp data-icon="inline-start" />
                  <span>Szavazok</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
