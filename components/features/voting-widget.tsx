'use client';

import { useVoting } from '@/hooks/use-voting';
import { VoteTopicCard } from './vote-topic-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Vote } from 'lucide-react';

export function VotingWidget() {
  const { topics, loading, error, vote, hasVoted, hasVotedAny } = useVoting();

  return (
    <Card className="border-2 border-foreground">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Vote className="size-5" />
          Szavazz a Következő Témára
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Segíts eldönteni, miről szóljon a következő kvízest!
        </p>
        {hasVotedAny && (
          <p className="mt-2 text-xs font-medium text-primary">
            Már leadtad a szavazatod. Köszönjük!
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : topics.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
            <p className="text-muted-foreground">Jelenleg nincs elérhető téma szavazásra.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {topics.map((topic, index) => (
              <VoteTopicCard
                key={topic.id}
                topic={topic}
                onVote={vote}
                hasVoted={hasVoted(topic.id)}
                hasVotedAny={hasVotedAny}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
