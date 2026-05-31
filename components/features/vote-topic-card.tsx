'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ThumbsUp, Check, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoteTopic } from '@/types';

interface VoteTopicCardProps {
  topic: VoteTopic;
  onVote: (topicId: string) => Promise<{ success: boolean; error?: string }>;
  hasVoted: boolean;
  hasVotedAny: boolean;
}

export function VoteTopicCard({ topic, onVote, hasVoted, hasVotedAny }: VoteTopicCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (hasVotedAny || isVoting) return;
    
    setIsVoting(true);
    await onVote(topic.id);
    setIsVoting(false);
  };

  const isDisabled = hasVotedAny || isVoting;

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-lg border-2 bg-card transition-all duration-300",
        hasVoted 
          ? "border-emerald-500 bg-emerald-500/10" 
          : hasVotedAny 
            ? "border-muted opacity-50" 
            : "border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20"
      )}
    >
      {/* Glow effect for voted item */}
      {hasVoted && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent" />
      )}
      
      <div className="relative flex items-stretch">
        {/* Image Section */}
        <div className="relative h-24 w-20 shrink-0 overflow-hidden sm:h-28 sm:w-24">
          {topic.imageUrl ? (
            <Image
              src={topic.imageUrl}
              alt={topic.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
              <span className="text-2xl font-black text-primary sm:text-3xl">
                {topic.title.charAt(0)}
              </span>
            </div>
          )}
          {/* Vote count overlay on image */}
          <div className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[0.6rem] font-bold text-white backdrop-blur-sm sm:text-xs">
            {topic.votes} szavazat
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col justify-center px-3 py-2 sm:px-4 sm:py-3">
          <h4 className="text-sm font-bold text-foreground sm:text-base">
            {topic.title}
          </h4>
          {topic.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
              {topic.description}
            </p>
          )}
        </div>

        {/* Vote Button Section */}
        <div className="flex shrink-0 items-center px-2 sm:px-3">
          <Button
            variant={hasVoted ? "default" : hasVotedAny ? "outline" : "default"}
            size="sm"
            onClick={handleVote}
            disabled={isDisabled}
            className={cn(
              "min-w-[80px] transition-all duration-300 sm:min-w-[100px]",
              hasVoted 
                ? "bg-emerald-600 hover:bg-emerald-700" 
                : hasVotedAny 
                  ? "cursor-not-allowed" 
                  : "bg-primary hover:bg-primary/90 hover:scale-105"
            )}
          >
            {isVoting ? (
              <>
                <Loader2 className="animate-spin" data-icon="inline-start" />
                <span className="text-xs sm:text-sm">...</span>
              </>
            ) : hasVoted ? (
              <>
                <Check data-icon="inline-start" />
                <span className="text-xs sm:text-sm">Kész</span>
              </>
            ) : hasVotedAny ? (
              <>
                <Lock data-icon="inline-start" />
                <span className="text-xs sm:text-sm">Zárva</span>
              </>
            ) : (
              <>
                <ThumbsUp data-icon="inline-start" />
                <span className="text-xs sm:text-sm">Szavazok</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
