import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { VotingSession } from "@/types";
import { ensureDate } from "@/lib/utils";

export const votingConverter: FirestoreDataConverter<VotingSession> = {
  toFirestore: (session: VotingSession) => {
    return {
      title: session.title || "",
      description: session.description || "",
      isActive: session.isActive,
      votepool: session.votepool,
      createdAt: session.createdAt
        ? Timestamp.fromDate(session.createdAt)
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions,
  ): VotingSession => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      createdAt: ensureDate(data.createdAt),
      updatedAt: ensureDate(data.updatedAt),
    } as VotingSession;
  },
};
