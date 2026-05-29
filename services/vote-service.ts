import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '@/lib/firebase';
import type { VoteTopic, VoteTopicFormData, ApiResponse } from '@/types';

const COLLECTION_NAME = 'vote_topics';

// Helper to convert Firestore document to VoteTopic
function documentToVoteTopic(doc: { id: string; data: () => Record<string, unknown> }): VoteTopic {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title as string,
    description: data.description as string | undefined,
    imageUrl: data.imageUrl as string | undefined,
    votes: (data.votes as number) || 0,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  };
}

// Get all vote topics
export async function getVoteTopics(): Promise<ApiResponse<VoteTopic[]>> {
  if (!isFirebaseConfigured()) {
    return { success: true, data: getMockVoteTopics() };
  }

  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      orderBy('votes', 'desc')
    );
    const snapshot = await getDocs(q);
    const topics = snapshot.docs.map(documentToVoteTopic);
    return { success: true, data: topics };
  } catch (error) {
    console.error('Error fetching vote topics:', error);
    return { success: false, error: 'Failed to fetch vote topics' };
  }
}

// Create new vote topic
export async function createVoteTopic(data: VoteTopicFormData): Promise<ApiResponse<VoteTopic>> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const now = new Date();
    const docRef = await addDoc(collection(firestore, COLLECTION_NAME), {
      ...data,
      votes: 0,
      createdAt: Timestamp.fromDate(now),
    });
    
    const newTopic: VoteTopic = {
      id: docRef.id,
      ...data,
      votes: 0,
      createdAt: now,
    };
    
    return { success: true, data: newTopic };
  } catch (error) {
    console.error('Error creating vote topic:', error);
    return { success: false, error: 'Failed to create vote topic' };
  }
}

// Vote for a topic
export async function voteForTopic(topicId: string): Promise<ApiResponse<void>> {
  if (!isFirebaseConfigured()) {
    return { success: true }; // Simulate success for mock data
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, topicId);
    await updateDoc(docRef, {
      votes: increment(1),
    });
    return { success: true };
  } catch (error) {
    console.error('Error voting for topic:', error);
    return { success: false, error: 'Failed to vote' };
  }
}

// Delete vote topic
export async function deleteVoteTopic(id: string): Promise<ApiResponse<void>> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting vote topic:', error);
    return { success: false, error: 'Failed to delete vote topic' };
  }
}

// Mock data for development without Firebase
function getMockVoteTopics(): VoteTopic[] {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'Rick and Morty',
      description: 'Wubba lubba dub dub!',
      imageUrl: '/images/rick-morty.jpg',
      votes: 42,
      createdAt: now,
    },
    {
      id: '2',
      title: 'The Witcher',
      description: 'Toss a coin to your Witcher!',
      imageUrl: '/images/witcher.jpg',
      votes: 38,
      createdAt: now,
    },
    {
      id: '3',
      title: 'Arcane',
      description: 'League of Legends animated series',
      imageUrl: '/images/arcane.jpg',
      votes: 35,
      createdAt: now,
    },
    {
      id: '4',
      title: 'Breaking Bad',
      description: 'Say my name!',
      imageUrl: '/images/breaking-bad.jpg',
      votes: 29,
      createdAt: now,
    },
  ];
}
