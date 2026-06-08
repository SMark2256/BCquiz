import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { Quiz } from "@/types";

export const quizConverter: FirestoreDataConverter<Quiz> = {
  toFirestore: (quiz: Quiz) => {
    return {
      title: quiz.title,
      titleHu: quiz.titleHu,
      description: quiz.description,
      date: Timestamp.fromDate(quiz.date),
      time: quiz.time,
      imageUrl: quiz.imageUrl,
      location: quiz.location,
      category: quiz.category,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt
        ? Timestamp.fromDate(quiz.createdAt)
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions,
  ): Quiz => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Quiz;
  },
};
