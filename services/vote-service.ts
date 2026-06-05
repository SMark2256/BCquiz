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
import {
  isMockMode,
  getLocalVoteTopics,
  getLocalVoteTopic,
  createLocalVoteTopic,
  updateLocalVoteTopic,
  deleteLocalVoteTopic,
  incrementLocalVote,
} from './mock-storage';
import type { VoteTopic, VoteTopicFormData, ApiResponse } from '@/types';

const COLLECTION_NAME = 'vote_topics';

// Check if we should use local storage
function shouldUseMockStorage(): boolean {
  return isMockMode() || !isFirebaseConfigured();
}

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
  if (shouldUseMockStorage()) {
    const activeTopics = getLocalVoteTopics().filter(t => t.isActive);
    return { success: true, data: activeTopics };
  }

  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
        where('isActive', '==', true),
      orderBy('votes', 'desc')
    );
    const snapshot = await getDocs(q);
    const topics = snapshot.docs.map(documentToVoteTopic);
    return { success: true, data: topics };
  } catch (error) {
    console.error('Error fetching vote topics:', error);
    return { success: false, error: 'Hiba a szavazási témák betöltésekor' };
  }
}

// Get single vote topic
export async function getVoteTopic(id: string): Promise<ApiResponse<VoteTopic>> {
  if (shouldUseMockStorage()) {
    const topic = getLocalVoteTopic(id);
    if (topic) return { success: true, data: topic };
    return { success: false, error: 'Szavazási téma nem található' };
  }

  try {
    const topics = await getVoteTopics();
    const topic = topics.data?.find(t => t.id === id);
    if (topic) return { success: true, data: topic };
    return { success: false, error: 'Szavazási téma nem található' };
  } catch (error) {
    console.error('Error fetching vote topic:', error);
    return { success: false, error: 'Hiba a szavazási téma betöltésekor' };
  }
}

// Create new vote topic
export async function createVoteTopic(data: VoteTopicFormData): Promise<ApiResponse<VoteTopic>> {
  if (shouldUseMockStorage()) {
    return createLocalVoteTopic(data);
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
    return { success: false, error: 'Hiba a szavazási téma létrehozásakor' };
  }
}

// Update vote topic
export async function updateVoteTopic(id: string, data: Partial<VoteTopicFormData>): Promise<ApiResponse<VoteTopic>> {
  if (shouldUseMockStorage()) {
    return updateLocalVoteTopic(id, data);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
    
    const result = await getVoteTopic(id);
    return result;
  } catch (error) {
    console.error('Error updating vote topic:', error);
    return { success: false, error: 'Hiba a szavazási téma frissítésekor' };
  }
}

// Vote for a topic
export async function voteForTopic(topicId: string): Promise<ApiResponse<VoteTopic>> {
  if (shouldUseMockStorage()) {
    return incrementLocalVote(topicId);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, topicId);
    await updateDoc(docRef, {
      votes: increment(1),
    });
    
    const result = await getVoteTopic(topicId);
    return result;
  } catch (error) {
    console.error('Error voting for topic:', error);
    return { success: false, error: 'Hiba a szavazat leadásakor' };
  }
}

// Delete vote topic
export async function deleteVoteTopic(id: string): Promise<ApiResponse<void>> {
  if (shouldUseMockStorage()) {
    return deleteLocalVoteTopic(id);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting vote topic:', error);
    return { success: false, error: 'Hiba a szavazási téma törlésekor' };
  }
}
