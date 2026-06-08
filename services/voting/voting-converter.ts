import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { VotingSession } from "@/types";

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
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as VotingSession;
  },
};
