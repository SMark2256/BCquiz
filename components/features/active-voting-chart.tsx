'use client';

import { useMemo, useCallback } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, LabelList } from 'recharts';
import { Activity, Trophy, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useActiveVotingSession } from '@/hooks/use-voting-sessions';

const BAR_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

export function ActiveVotingChart() {
  const activeSession = useActiveVotingSession();

  const { chartData, totalVotes, leaderId } = useMemo(() => {
    if (!activeSession) {
      return { chartData: [], totalVotes: 0, leaderId: null as string | null };
    }

    const total = activeSession.votepool.reduce((sum, t) => sum + t.votes, 0);

    const data = activeSession.votepool.map((topic, index) => ({
      id: topic.id,
      label: topic.title,
      votes: topic.votes,
      percentage: total > 0 ? Math.round((topic.votes / total) * 100) : 0,
      fill: BAR_COLORS[index % BAR_COLORS.length],
    }));

    // Highest vote count is the leader (only when at least one vote exists).
    let leader: string | null = null;
    if (total > 0) {
      leader = data.reduce((best, cur) => (cur.votes > best.votes ? cur : best)).id;
    }

    return { chartData: data, totalVotes: total, leaderId: leader };
  }, [activeSession]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return { votes: { label: 'Szavazat' } } satisfies ChartConfig;
  }, []);

  const renderTooltip = useCallback(
      (value: any, name: any, item: any) => (
          <div className="flex w-full items-center justify-between gap-3">
      <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: item.payload.fill }}
      />
            <span className="text-muted-foreground">{item.payload.label}</span>
            <span className="ml-auto font-mono font-medium tabular-nums">
        {value} ({item.payload.percentage}%)
      </span>
          </div>
      ),
      [] // Mivel nem függ semmi külső változótól, ez stabil marad
  );

  // Recharts v3 keeps layout props (margin, etc.) in an internal store and
  // dispatches on every reference change. An inline object would be a new
  // reference each render, causing an infinite update loop (React error #185),
  // so we memoize it to a single stable reference.
  const chartMargin = useMemo(() => ({ left: 8, right: 40, top: 4, bottom: 4 }), []);

  // No active session — make this state explicit for the admin.
  if (!activeSession) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <BarChart3 className="size-8 text-muted-foreground" />
          <p className="font-medium">Nincs aktív szavazás</p>
          <p className="max-w-sm text-sm text-muted-foreground text-balance">
            Aktiválj egy szavazást a lenti listából, és itt valós időben látod majd az aktuális állását.
          </p>
        </CardContent>
      </Card>
    );
  }

  const leader = chartData.find((d) => d.id === leaderId);
  // Dynamic height so many options stay readable.
  const chartHeight = Math.max(180, chartData.length * 56);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-1 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-chart-1" />
              </span>
              <span className="truncate">{activeSession.title || 'Aktív szavazás'}</span>
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5">
              <Activity className="size-3.5" />
              Élő állapot &middot; valós időben frissül
            </CardDescription>
          </div>
          <Badge className="gap-1.5 bg-chart-1 text-white hover:bg-chart-1">
            <Users className="size-3.5" />
            {totalVotes} szavazat
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {totalVotes === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-10 text-center">
            <p className="font-medium">Még nincs leadott szavazat</p>
            <p className="text-sm text-muted-foreground">
              Amint érkeznek a szavazatok, itt jelenik meg a diagram.
            </p>
          </div>
        ) : (
          <>
            {leader && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <Trophy className="size-4 shrink-0 text-chart-2" />
                <span className="text-muted-foreground">Jelenleg vezet:</span>
                <span className="truncate font-semibold">{leader.label}</span>
                <span className="ml-auto shrink-0 font-semibold tabular-nums">{leader.percentage}%</span>
              </div>
            )}

            <ChartContainer config={chartConfig} style={{ height: chartHeight }} className="w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={chartMargin}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) =>
                    value.length > 16 ? `${value.slice(0, 15)}…` : value
                  }
                />
                <XAxis dataKey="votes" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={renderTooltip} />}
                />
                <Bar dataKey="votes" radius={6} maxBarSize={44}>
                  {chartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="votes"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
