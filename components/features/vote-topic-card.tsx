'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ThumbsUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { VoteTopic } from '@/types';

interface VoteTopicCardProps {
  topic: VoteTopic;
  onVote: (topicId: string) => Promise<{ success: boolean; error?: string }>;
  hasVoted: boolean;
  rank: number;
}

export function VoteTopicCard({ topic, onVote, hasVoted, rank }: VoteTopicCardProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (hasVoted || isVoting) return;
    
    setIsVoting(true);
    await onVote(topic.id);
    setIsVoting(false);
  };

  return (
    <Card className={cn(
      "overflow-hidden border transition-all",
      hasVoted ? "border-primary bg-primary/5" : "hover:border-primary/50"
    )}>
      <CardContent className="flex items-center gap-4 p-3">
        {/* Rank */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
          {rank}
        </div>

        {/* Image */}
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
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
              <span className="text-lg font-bold text-muted-foreground">
                {topic.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{topic.title}</h4>
          {topic.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{topic.description}</p>
          )}
        </div>

        {/* Vote Count */}
        <div className="text-right">
          <span className="text-lg font-bold text-foreground">{topic.votes}</span>
          <p className="text-xs text-muted-foreground">votes</p>
        </div>

        {/* Vote Button */}
        <Button
          variant={hasVoted ? "secondary" : "default"}
          size="sm"
          onClick={handleVote}
          disabled={hasVoted || isVoting}
          className="shrink-0"
        >
          {hasVoted ? (
            <>
              <Check data-icon="inline-start" />
              Voted
            </>
          ) : (
            <>
              <ThumbsUp data-icon="inline-start" />
              Vote
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
