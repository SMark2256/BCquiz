import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { firestore, isFirebaseConfigured, trackQuery } from "@/lib/firebase";
import {
  isMockMode,
  getLocalQuizzes,
  getLocalUpcomingQuizzes,
  getLocalQuiz,
  createLocalQuiz,
  updateLocalQuiz,
  deleteLocalQuiz,
  subscribeToStorage,
} from "../mock-storage";
import type { Quiz, QuizFormData, ApiResponse } from "@/types";
import { quizConverter } from "@/services/quiz/qui-converter";

const COLLECTION_NAME = "quizzes";
const quizCollection = collection(firestore, COLLECTION_NAME).withConverter(
  quizConverter,
);

// Check if we should use local storage
function shouldUseMockStorage(): boolean {
  return isMockMode() || !isFirebaseConfigured();
}

export function subscribeToUpcomingQuizzes(
  callback: (quizzes: Quiz[]) => void,
  onError?: (error: Error) => void,
) {
  if (shouldUseMockStorage()) {
    // Mock mód esetén a meglévő eseménykezelőt használjuk
    const getActiveUpcoming = () =>
      getLocalUpcomingQuizzes().filter((q) => q.isActive);
    callback(getActiveUpcoming());
    return subscribeToStorage(() => callback(getActiveUpcoming()));
  }

  const now = new Date();
  const q = query(
    collection(firestore, "quizzes"),
    where("isActive", "==", true),
    where("date", ">=", Timestamp.fromDate(now)),
    orderBy("date", "asc"),
  );

  // Az onSnapshot adja a valós idejű kapcsolatot
  return onSnapshot(
    q,
    (snapshot) => {
      const quizzes = snapshot.docs.map(documentToQuiz);
      callback(quizzes);
    },
    (error) => {
      console.error("Real-time updates error:", error);
      if (onError) onError(error);
    },
  );
}

export function subscribeToQuizzes(
  callback: (quizzes: Quiz[]) => void,
  onError?: (error: Error) => void,
) {
  if (shouldUseMockStorage()) {
    callback(getLocalQuizzes());
    return subscribeToStorage(() => callback(getLocalQuizzes()));
  }
  const now = new Date();
  const q = query(
    collection(firestore, "quizzes"),
    where("isActive", "==", true),
    where("date", ">=", Timestamp.fromDate(now)),
    orderBy("date", "asc"),
  );

  // Az onSnapshot adja a valós idejű kapcsolatot
  return onSnapshot(
    q,
    (snapshot) => {
      const quizzes = snapshot.docs.map(documentToQuiz);
      callback(quizzes);
    },
    (error) => {
      console.error("Real-time updates error:", error);
      if (onError) onError(error);
    },
  );
}

// Helper to convert Firestore document to Quiz
function documentToQuiz(doc: {
  id: string;
  data: () => Record<string, unknown>;
}): Quiz {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title as string,
    titleHu: data.titleHu as string | undefined,
    description: data.description as string | undefined,
    date: (data.date as Timestamp)?.toDate() || new Date(),
    time: data.time as string,
    imageUrl: data.imageUrl as string | undefined,
    location: data.location as string | undefined,
    category: data.category as string | undefined,
    isActive: data.isActive as boolean,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

// Get all quizzes
export async function getQuizzes(): Promise<ApiResponse<Quiz[]>> {
  if (shouldUseMockStorage()) {
    return { success: true, data: getLocalQuizzes() };
  }

  try {
    const q = query(quizCollection, orderBy("date", "asc"));

    const snapshot = await trackQuery("getQuizzes", () => getDocs(q));

    return { success: true, data: snapshot.docs.map((doc) => doc.data()) };
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return { success: false, error: "Hiba a kvízek betöltésekor" };
  }
}

// Get upcoming quizzes (active and future date)
export async function getUpcomingQuizzes(): Promise<ApiResponse<Quiz[]>> {
  if (shouldUseMockStorage()) {
    return { success: true, data: getLocalUpcomingQuizzes() };
  }

  try {
    const now = new Date();
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where("isActive", "==", true),
      where("date", ">=", Timestamp.fromDate(now)),
      orderBy("date", "asc"),
    );
    const snapshot = await trackQuery("getUpcomingQuizzes", () => getDocs(q));

    const quizzes = snapshot.docs.map(documentToQuiz);
    return { success: true, data: quizzes };
  } catch (error) {
    console.error("Error fetching upcoming quizzes:", error);
    return { success: false, error: "Hiba a közelgő kvízek betöltésekor" };
  }
}

// Get single quiz by ID
export async function getQuiz(id: string): Promise<ApiResponse<Quiz>> {
  if (shouldUseMockStorage()) {
    const quiz = getLocalQuiz(id);
    if (quiz) return { success: true, data: quiz };
    return { success: false, error: "Kvíz nem található" };
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: "Kvíz nem található" };
    }

    return {
      success: true,
      data: documentToQuiz({ id: docSnap.id, data: () => docSnap.data() }),
    };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return { success: false, error: "Hiba a kvíz betöltésekor" };
  }
}

// Create new quiz
export async function createQuiz(
  data: QuizFormData,
): Promise<ApiResponse<Quiz>> {
  if (shouldUseMockStorage()) {
    return createLocalQuiz(data);
  }

  try {
    const now = new Date();
    // A quizCollection használata a manuális addDoc helyett
    const docRef = await addDoc(quizCollection, {
      ...data,
      id: "", // A converter kezeli az ID-t
      createdAt: now,
      updatedAt: now,
    } as Quiz);

    return {
      success: true,
      data: { id: docRef.id, ...data, createdAt: now, updatedAt: now },
    };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return { success: false, error: "Hiba a kvíz létrehozásakor" };
  }
}

// Update quiz
export async function updateQuiz(
  id: string,
  data: Partial<QuizFormData>,
): Promise<ApiResponse<Quiz>> {
  if (shouldUseMockStorage()) {
    return updateLocalQuiz(id, data);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    const updateData = {
      ...data,
      ...(data.date && { date: Timestamp.fromDate(data.date) }),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await updateDoc(docRef, updateData);

    const result = await getQuiz(id);
    return result;
  } catch (error) {
    console.error("Error updating quiz:", error);
    return { success: false, error: "Hiba a kvíz frissítésekor" };
  }
}

// Delete quiz
export async function deleteQuiz(id: string): Promise<ApiResponse<void>> {
  if (shouldUseMockStorage()) {
    return deleteLocalQuiz(id);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return { success: false, error: "Hiba a kvíz törlésekor" };
  }
}

// Toggle quiz active status
export async function toggleQuizActive(id: string): Promise<ApiResponse<Quiz>> {
  if (shouldUseMockStorage()) {
    return (await import("../mock-storage")).toggleLocalQuizActive(id);
  }

  try {
    const quizResult = await getQuiz(id);
    if (!quizResult.success || !quizResult.data) {
      return { success: false, error: "Kvíz nem található" };
    }

    const docRef = doc(firestore, COLLECTION_NAME, id);
    const newActiveState = !quizResult.data.isActive;

    await updateDoc(docRef, {
      isActive: newActiveState,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return {
      success: true,
      data: { ...quizResult.data, isActive: newActiveState },
    };
  } catch (error) {
    console.error("Error toggling quiz active status:", error);
    return { success: false, error: "Hiba a kvíz állapotának módosításakor" };
  }
}

export async function fetchQuizzesDirectly(upcomingOnly: boolean = false) {
  const response = upcomingOnly
    ? await getUpcomingQuizzes()
    : await getQuizzes();
  if (!response.success) throw new Error(response.error);
  return response.data;
}
