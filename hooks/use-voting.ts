"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVotingSessions } from "./use-voting-sessions";
import {
  voteForVoteTopic,
  checkUserVoted,
} from "@/services/voting/voting-service";
import localforage from "localforage";

const VISITOR_ID_KEY = "bcquiz_visitor_id";

export function useVoting(staleTime: number = 1000 * 60 * 60 * 24) {
  const queryClient = useQueryClient();
  const {
    sessions,
    loading: queryLoading,
    isFetching: sessionsFetching,
    error,
  } = useVotingSessions();
  const [visitorId, setVisitorId] = useState<string>("");
  const [isIdResolving, setIsIdResolving] = useState(true);

  useEffect(() => {
    const initVisitorId = async () => {
      try {
        // Megpróbáljuk beolvasni a localforage-ból
        let id = await localforage.getItem<string>(VISITOR_ID_KEY);

        if (!id) {
          // Ha nincs, generálunk egy újat
          id = crypto.randomUUID();
          await localforage.setItem(VISITOR_ID_KEY, id);
        }

        setVisitorId(id);
      } catch (err) {
        console.error("Hiba a visitorId kezelésekor:", err);
      } finally {
        setIsIdResolving(false);
      }
    };

    initVisitorId();
  }, []);

  const activeSession = useMemo(
    () => sessions.find((s) => s.isActive) || null,
    [sessions],
  );
  const sessionId = activeSession?.id ?? null;

  // A szavazat ellenőrzése a szerverről a visitorId alapján
  const {
    data: serverVoteData,
    isLoading: serverCheckLoading,
    isFetched: isVoteFetched,
  } = useQuery({
    queryKey: ["checkVoted", sessionId, visitorId],
    queryFn: () => checkUserVoted(sessionId!, visitorId),
    enabled: !!sessionId && !!visitorId,
    staleTime,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const isReallyLoading =
    queryLoading ||
    isIdResolving ||
    (sessions.length === 0 && sessionsFetching) ||
    (!!sessionId && !!visitorId && (serverCheckLoading || !isVoteFetched));

  const hasVotedAny = useMemo(() => {
    return serverVoteData?.hasVoted || false;
  }, [serverVoteData]);

  const hasVoted = (topicId: string) => {
    return serverVoteData?.hasVoted && serverVoteData.data?.topicId === topicId;
  };

  const vote = async (topicId: string) => {
    if (!sessionId) return { success: false, error: "Nincs aktív szavazás" };
    if (hasVotedAny)
      return { success: false, error: "Már leadtad a szavazatod." };

    // A visitorId-t küldjük el a fingerprint mezőbe
    const result = await voteForVoteTopic(sessionId, topicId, visitorId);

    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: ["voting_sessions"] });
      await queryClient.invalidateQueries({
        queryKey: ["checkVoted", sessionId, visitorId],
      });
      return { success: true };
    }
    return result;
  };

  return {
    topics: activeSession
      ? [...activeSession.votepool].sort((a, b) => b.votes - a.votes)
      : [],
    loading: isReallyLoading,
    error: error || null,
    vote,
    hasVoted,
    hasVotedAny,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["voting_sessions"] }),
  };
}
