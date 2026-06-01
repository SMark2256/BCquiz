'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PollOption } from '@/types';

interface PollOptionCardProps {
  option: PollOption;
  totalVotes: number;
  onVote: () => Promise<{ success: boolean; error?: string }>;
  hasVoted: boolean;
  isVotedOption: boolean;
  disabled: boolean;
}

export function PollOptionCard({
  option,
  totalVotes,
  onVote,
  hasVoted,
  isVotedOption,
  disabled,
}: PollOptionCardProps) {
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

  const handleVote = async () => {
    if (disabled || voting) return;
    
    setVoting(true);
    setError(null);
    
    const result = await onVote();
    
    if (!result.success) {
      setError(result.error || 'Hiba történt a szavazat leadásakor');
    }
    
    setVoting(false);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-2 transition-all',
        isVotedOption
          ? 'border-emerald-500 bg-emerald-500/10'
          : hasVoted
          ? 'border-border bg-card'
          : 'border-border bg-card hover:border-foreground/30 hover:bg-accent/50'
      )}
    >
      {/* Vote percentage bar */}
      {hasVoted && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-500',
            isVotedOption ? 'bg-emerald-500/20' : 'bg-muted'
          )}
          style={{ width: `${percentage}%` }}
        />
      )}

      <div className="relative flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Image */}
        {option.imageUrl ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg sm:size-16">
            <Image
              src={option.imageUrl}
              alt={option.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted sm:size-16">
            <ImageIcon className="size-6 text-muted-foreground sm:size-7" />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold sm:text-base">{option.title}</h3>
            {isVotedOption && (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <Check className="size-3 text-white" />
              </div>
            )}
          </div>
          {option.description && (
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {option.description}
            </p>
          )}
          
          {/* Vote count - always show after voting */}
          {hasVoted && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-medium sm:text-sm">
                {option.votes} szavazat
              </span>
              <span className="text-xs text-muted-foreground">
                ({percentage}%)
              </span>
            </div>
          )}
        </div>

        {/* Vote Button */}
        {!hasVoted && (
          <Button
            size="sm"
            onClick={handleVote}
            disabled={disabled || voting}
            className="shrink-0"
          >
            {voting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Szavazok'
            )}
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="border-t border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive sm:px-4">
          {error}
        </div>
      )}
    </div>
  );
}
