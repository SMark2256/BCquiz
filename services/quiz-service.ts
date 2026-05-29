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
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '@/lib/firebase';
import type { Quiz, QuizFormData, ApiResponse } from '@/types';

const COLLECTION_NAME = 'quizzes';

// Helper to convert Firestore document to Quiz
function documentToQuiz(doc: { id: string; data: () => Record<string, unknown> }): Quiz {
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
  if (!isFirebaseConfigured()) {
    return { success: true, data: getMockQuizzes() };
  }

  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    const quizzes = snapshot.docs.map(documentToQuiz);
    return { success: true, data: quizzes };
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return { success: false, error: 'Failed to fetch quizzes' };
  }
}

// Get upcoming quizzes (active and future date)
export async function getUpcomingQuizzes(): Promise<ApiResponse<Quiz[]>> {
  if (!isFirebaseConfigured()) {
    return { success: true, data: getMockQuizzes().filter(q => q.isActive) };
  }

  try {
    const now = new Date();
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('isActive', '==', true),
      where('date', '>=', Timestamp.fromDate(now)),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    const quizzes = snapshot.docs.map(documentToQuiz);
    return { success: true, data: quizzes };
  } catch (error) {
    console.error('Error fetching upcoming quizzes:', error);
    return { success: false, error: 'Failed to fetch upcoming quizzes' };
  }
}

// Get single quiz by ID
export async function getQuiz(id: string): Promise<ApiResponse<Quiz>> {
  if (!isFirebaseConfigured()) {
    const quiz = getMockQuizzes().find(q => q.id === id);
    if (quiz) return { success: true, data: quiz };
    return { success: false, error: 'Quiz not found' };
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Quiz not found' };
    }
    
    return { success: true, data: documentToQuiz({ id: docSnap.id, data: () => docSnap.data() }) };
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return { success: false, error: 'Failed to fetch quiz' };
  }
}

// Create new quiz
export async function createQuiz(data: QuizFormData): Promise<ApiResponse<Quiz>> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const now = new Date();
    const docRef = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
    
    const newQuiz: Quiz = {
      id: docRef.id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    
    return { success: true, data: newQuiz };
  } catch (error) {
    console.error('Error creating quiz:', error);
    return { success: false, error: 'Failed to create quiz' };
  }
}

// Update quiz
export async function updateQuiz(id: string, data: Partial<QuizFormData>): Promise<ApiResponse<Quiz>> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
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
    console.error('Error updating quiz:', error);
    return { success: false, error: 'Failed to update quiz' };
  }
}

// Delete quiz
export async function deleteQuiz(id: string): Promise<ApiResponse<void>> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return { success: false, error: 'Failed to delete quiz' };
  }
}

// Mock data for development without Firebase
function getMockQuizzes(): Quiz[] {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'Disenchantment',
      titleHu: 'A Kiábrándult Királylány',
      description: 'Test your knowledge about the animated series Disenchantment!',
      date: new Date(now.getFullYear(), now.getMonth(), 21),
      time: '20:00',
      imageUrl: '/images/disenchantment.jpg',
      location: 'BarCraft Corvin',
      category: 'Animation',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '2',
      title: 'BoJack Horseman',
      titleHu: 'BoJack Horseman',
      description: 'How well do you know BoJack and the gang?',
      date: new Date(now.getFullYear(), now.getMonth(), 28),
      time: '20:00',
      imageUrl: '/images/bojack.jpg',
      location: 'BarCraft Corvin',
      category: 'Animation',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '3',
      title: 'Devil May Cry',
      titleHu: 'Devil May Cry',
      description: 'Netflix anime quiz night!',
      date: new Date(now.getFullYear(), now.getMonth() + 1, 4),
      time: '20:00',
      imageUrl: '/images/dmc.jpg',
      location: 'BarCraft Corvin',
      category: 'Anime',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '4',
      title: 'Gravity Falls',
      titleHu: 'Rejtélyek Városkája',
      description: 'Mystery quiz about the mysterious town!',
      date: new Date(now.getFullYear(), now.getMonth() + 1, 11),
      time: '20:00',
      imageUrl: '/images/gravity-falls.jpg',
      location: 'BarCraft Corvin',
      category: 'Animation',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
