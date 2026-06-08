"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVotingSessions } from "./use-voting-sessions";
import {
  voteForVoteTopic,
  checkUserVoted,
} from "@/services/voting/voting-service";

const VOTE_STORAGE_KEY = "bcquiz_vote_record";

interface VoteRecord {
  sessionId: string;
  topicId: string;
  timestamp: number;
  fingerprint: string;
}

// Egyszerű böngésző ujjlenyomat generálása
function generateFingerprint(): string {
  if (typeof window === "undefined") return "server";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("fingerprint", 2, 2);
  }
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    canvas.toDataURL(),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function useVoting() {
  const queryClient = useQueryClient();
  const { sessions, loading: queryLoading, error } = useVotingSessions();
  const [isCheckingVoted, setIsCheckingVoted] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>("");

  // Fingerprint generálása csak a kliensen, egyszer
  useEffect(() => {
    setFingerprint(generateFingerprint());
  }, []);

  const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(null);

  // const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(() => {
  //   if (typeof window === "undefined") return null;
  //   const saved = localStorage.getItem(VOTE_STORAGE_KEY);
  //   if (!saved) return null;
  //   try {
  //     const record = JSON.parse(saved) as VoteRecord;
  //     // Az ujjlenyomatot itt még a frissen generált értékkel hasonlítjuk össze
  //     const currentFp = generateFingerprint();
  //     if (record.fingerprint === currentFp) {
  //       return record;
  //     }
  //     localStorage.removeItem(VOTE_STORAGE_KEY);
  //     return null;
  //   } catch {
  //     localStorage.removeItem(VOTE_STORAGE_KEY);
  //     return null;
  //   }
  // });

  const activeSession = useMemo(
    () => sessions.find((s) => s.isActive) || null,
    [sessions],
  );
  const sessionId = activeSession?.id ?? null;

  useEffect(() => {
    if (!sessionId || !fingerprint) return;

    const saved = localStorage.getItem(VOTE_STORAGE_KEY);
    if (saved) {
      const record = JSON.parse(saved) as VoteRecord;
      if (
        record.sessionId === sessionId &&
        record.fingerprint === fingerprint
      ) {
        setVoteRecord(record);
        return;
      }
    }

    // Ha nincs local adat, nézzük meg a szerveren
    const checkServer = async () => {
      setIsCheckingVoted(true);
      const result = await checkUserVoted(sessionId, fingerprint);
      if (result.hasVoted && result.data) {
        const serverRecord = {
          sessionId,
          topicId: result.data.topicId,
          timestamp: result.data.timestamp,
          fingerprint,
        };
        setVoteRecord(serverRecord);
        localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(serverRecord));
      }
      setIsCheckingVoted(false);
    };

    checkServer();
  }, [sessionId, fingerprint]);

  const topics = useMemo(
    () =>
      activeSession
        ? [...activeSession.votepool].sort((a, b) => b.votes - a.votes)
        : [],
    [activeSession],
  );

  const vote = async (topicId: string) => {
    if (!sessionId) return { success: false, error: "Nincs aktív szavazás" };

    if (hasVotedAny) {
      return { success: false, error: "Már leadtad a szavazatod." };
    }

    if (voteRecord && voteRecord.sessionId === sessionId) {
      return { success: false, error: "Már leadtad a szavazatod." };
    }

    const result = await voteForVoteTopic(sessionId, topicId, fingerprint);

    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: ["voting_sessions"] });

      const newRecord: VoteRecord = {
        sessionId,
        topicId,
        timestamp: Date.now(),
        fingerprint,
      };

      setVoteRecord(newRecord);
      if (typeof window !== "undefined") {
        localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(newRecord));
      }
      return { success: true };
    }

    return result;
  };

  const hasVoted = (topicId: string) =>
    voteRecord?.sessionId === sessionId && voteRecord?.topicId === topicId;

  const hasVotedAny =
    voteRecord?.sessionId === sessionId && voteRecord !== null;

  return {
    topics,
    loading: queryLoading,
    error: error || null,
    vote,
    hasVoted,
    hasVotedAny,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["voting_sessions"] }),
  };
}
