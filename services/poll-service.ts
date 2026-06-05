import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '@/lib/firebase';
import {
  isMockMode,
  getLocalPolls,
  getLocalPoll,
  createLocalPoll,
  updateLocalPoll,
  deleteLocalPoll,
  voteLocalPollOption,
  resetLocalPollVotes,
} from './mock-storage';
import type { Poll, PollFormData, PollOption, ApiResponse } from '@/types';

const COLLECTION_NAME = 'polls';

// Check if we should use local storage
function shouldUseMockStorage(): boolean {
  return isMockMode() || !isFirebaseConfigured();
}

// Helper to convert Firestore document to Poll
function documentToPoll(doc: { id: string; data: () => Record<string, unknown> }): Poll {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title as string,
    description: data.description as string | undefined,
    isActive: (data.isActive as boolean) ?? true,
    options: (data.options as Record<string, PollOption>) || {},
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

// Get all polls
export async function getPolls(): Promise<ApiResponse<Poll[]>> {
  if (shouldUseMockStorage()) {
    return { success: true, data: getLocalPolls() };
  }

  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const polls = snapshot.docs.map(documentToPoll);
    return { success: true, data: polls };
  } catch (error) {
    console.error('Error fetching polls:', error);
    return { success: false, error: 'Hiba a szavazások betöltésekor' };
  }
}

// Get active polls only
export async function getActivePolls(): Promise<ApiResponse<Poll[]>> {
  const result = await getPolls();
  if (result.success && result.data) {
    return { success: true, data: result.data.filter(p => p.isActive) };
  }
  return result;
}

// Get single poll
export async function getPoll(id: string): Promise<ApiResponse<Poll>> {
  if (shouldUseMockStorage()) {
    const poll = getLocalPoll(id);
    if (poll) return { success: true, data: poll };
    return { success: false, error: 'Szavazás nem található' };
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { success: true, data: documentToPoll(snapshot as { id: string; data: () => Record<string, unknown> }) };
    }
    return { success: false, error: 'Szavazás nem található' };
  } catch (error) {
    console.error('Error fetching poll:', error);
    return { success: false, error: 'Hiba a szavazás betöltésekor' };
  }
}

// Create new poll
export async function createPoll(data: PollFormData): Promise<ApiResponse<Poll>> {
  if (shouldUseMockStorage()) {
    return createLocalPoll(data);
  }

  try {
    const now = new Date();
    
    // Convert options array to map with generated IDs
    const optionsMap: Record<string, PollOption> = {};
    data.options.forEach((opt, index) => {
      const optionId = opt.id || `opt-${Date.now()}-${index}`;
      optionsMap[optionId] = {
        id: optionId,
        title: opt.title,
        description: opt.description,
        imageUrl: opt.imageUrl,
        votes: 0,
      };
    });
    
    const docRef = await addDoc(collection(firestore, COLLECTION_NAME), {
      title: data.title,
      description: data.description,
      isActive: data.isActive,
      options: optionsMap,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
    
    const newPoll: Poll = {
      id: docRef.id,
      title: data.title,
      description: data.description,
      isActive: data.isActive,
      options: optionsMap,
      createdAt: now,
      updatedAt: now,
    };
    
    return { success: true, data: newPoll };
  } catch (error) {
    console.error('Error creating poll:', error);
    return { success: false, error: 'Hiba a szavazás létrehozásakor' };
  }
}

// Update poll
export async function updatePoll(id: string, data: Partial<PollFormData>): Promise<ApiResponse<Poll>> {
  if (shouldUseMockStorage()) {
    return updateLocalPoll(id, data);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    
    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // Convert options array to map if provided
    if (data.options) {
      const optionsMap: Record<string, PollOption> = {};
      data.options.forEach((opt, index) => {
        const optionId = opt.id || `opt-${Date.now()}-${index}`;
        optionsMap[optionId] = {
          id: optionId,
          title: opt.title,
          description: opt.description,
          imageUrl: opt.imageUrl,
          votes: 0, // Preserve existing votes if editing
        };
      });
      
      // Get existing poll to preserve vote counts
      const existingPoll = await getPoll(id);
      if (existingPoll.success && existingPoll.data) {
        Object.keys(optionsMap).forEach(optId => {
          if (existingPoll.data!.options[optId]) {
            optionsMap[optId].votes = existingPoll.data!.options[optId].votes;
          }
        });
      }
      
      updateData.options = optionsMap;
    }
    
    await updateDoc(docRef, updateData);
    
    const result = await getPoll(id);
    return result;
  } catch (error) {
    console.error('Error updating poll:', error);
    return { success: false, error: 'Hiba a szavazás frissítésekor' };
  }
}

// Vote for a poll option
export async function voteForPollOption(pollId: string, optionId: string): Promise<ApiResponse<Poll>> {
  if (shouldUseMockStorage()) {
    return voteLocalPollOption(pollId, optionId);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, pollId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Szavazás nem található' };
    }
    
    const pollData = snapshot.data();
    const options = pollData.options as Record<string, PollOption>;
    
    if (!options[optionId]) {
      return { success: false, error: 'Opció nem található' };
    }
    
    // Increment vote count
    options[optionId].votes += 1;
    
    await updateDoc(docRef, {
      options,
      updatedAt: Timestamp.fromDate(new Date()),
    });
    
    const result = await getPoll(pollId);
    return result;
  } catch (error) {
    console.error('Error voting for poll option:', error);
    return { success: false, error: 'Hiba a szavazat leadásakor' };
  }
}

// Reset all votes for a poll
export async function resetPollVotes(pollId: string): Promise<ApiResponse<Poll>> {
  if (shouldUseMockStorage()) {
    return resetLocalPollVotes(pollId);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, pollId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Szavazás nem található' };
    }
    
    const pollData = snapshot.data();
    const options = pollData.options as Record<string, PollOption>;
    
    // Reset all vote counts to 0
    Object.keys(options).forEach(optId => {
      options[optId].votes = 0;
    });
    
    await updateDoc(docRef, {
      options,
      updatedAt: Timestamp.fromDate(new Date()),
    });
    
    const result = await getPoll(pollId);
    return result;
  } catch (error) {
    console.error('Error resetting poll votes:', error);
    return { success: false, error: 'Hiba a szavazatok nullázásakor' };
  }
}

// Delete poll
export async function deletePoll(id: string): Promise<ApiResponse<void>> {
  if (shouldUseMockStorage()) {
    return deleteLocalPoll(id);
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting poll:', error);
    return { success: false, error: 'Hiba a szavazás törlésekor' };
  }
}

// Toggle poll active state
export async function togglePollActive(pollId: string): Promise<ApiResponse<Poll>> {
  const poll = await getPoll(pollId);
  if (!poll.success || !poll.data) {
    return poll;
  }
  
  return updatePoll(pollId, { isActive: !poll.data.isActive });
}

export function subscribeToActivePolls(callback: (polls: Poll[]) => void, onError?: (error: any) => void) {
  if (shouldUseMockStorage()) {
    const getActive = () => getLocalPolls().filter(p => p.isActive);
    callback(getActive());
    return subscribeToStorage(() => callback(getActive()));
  }

  const q = query(
      collection(firestore, COLLECTION_NAME),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const polls = snapshot.docs.map(documentToPoll);
    callback(polls);
  }, (error) => {
    if (onError) onError(error);
  });
}
