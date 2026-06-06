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
  getLocalVotingSessions,
  getLocalVotingSession,
  createLocalVotingSession,
  updateLocalVotingSession,
  deleteLocalVotingSession,
  setLocalActiveVotingSession,
  toggleLocalVotingSessionActive,
  voteLocalVoteTopic,
  resetLocalVotingSessionVotes,
} from './mock-storage';
import type { VotingSession, VotingSessionFormData, VoteTopic, ApiResponse } from '@/types';

const COLLECTION_NAME = 'voting_sessions';

// Check if we should use local storage instead of Firebase.
function shouldUseMockStorage(): boolean {
  return isMockMode() || !isFirebaseConfigured();
}

// Helper to convert a Firestore document to a VotingSession.
function documentToVotingSession(doc: { id: string; data: () => Record<string, unknown> }): VotingSession {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title as string | undefined,
    description: data.description as string | undefined,
    isActive: (data.isActive as boolean) ?? false,
    votepool: (data.votepool as VoteTopic[]) || [],
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

// Build a votepool from form data, preserving existing vote counts by id.
function buildVotepool(
  items: VotingSessionFormData['votepool'],
  existing: VoteTopic[] = []
): VoteTopic[] {
  return items.map((item, index) => {
    const id = item.id || `topic-${Date.now()}-${index}`;
    const previous = existing.find(t => t.id === id);
    return {
      id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      votes: previous?.votes ?? 0,
    };
  });
}

// Get all voting sessions (newest first).
export async function getVotingSessions(): Promise<ApiResponse<VotingSession[]>> {
  if (shouldUseMockStorage()) {
    return { success: true, data: getLocalVotingSessions() };
  }

  try {
    const q = query(collection(firestore, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(documentToVotingSession);
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error fetching voting sessions:', error);
    return { success: false, error: 'Hiba a szavazások betöltésekor' };
  }
}

// Get the single active voting session, if any.
export async function getActiveVotingSession(): Promise<ApiResponse<VotingSession | null>> {
  const result = await getVotingSessions();
  if (result.success && result.data) {
    return { success: true, data: result.data.find(s => s.isActive) ?? null };
  }
  return { success: false, error: result.error };
}

// Get a single voting session by id.
export async function getVotingSession(id: string): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    const session = getLocalVotingSession(id);
    if (session) return { success: true, data: session };
    return { success: false, error: 'Szavazás nem található' };
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return {
        success: true,
        data: documentToVotingSession(snapshot as { id: string; data: () => Record<string, unknown> }),
      };
    }
    return { success: false, error: 'Szavazás nem található' };
  } catch (error) {
    console.error('Error fetching voting session:', error);
    return { success: false, error: 'Hiba a szavazás betöltésekor' };
  }
}

// Create a new voting session. Only one session can be active at a time.
export async function createVotingSession(data: VotingSessionFormData): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return createLocalVotingSession(data);
  }

  try {
    const now = new Date();
    const votepool = buildVotepool(data.votepool);

    // Enforce single active session: deactivate the others first.
    if (data.isActive) {
      await deactivateAllSessions();
    }

    const docRef = await addDoc(collection(firestore, COLLECTION_NAME), {
      title: data.title ?? null,
      description: data.description ?? null,
      isActive: data.isActive,
      votepool,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    return {
      success: true,
      data: {
        id: docRef.id,
        title: data.title,
        description: data.description,
        isActive: data.isActive,
        votepool,
        createdAt: now,
        updatedAt: now,
      },
    };
  } catch (error) {
    console.error('Error creating voting session:', error);
    return { success: false, error: 'Hiba a szavazás létrehozásakor' };
  }
}

// Update an existing voting session.
export async function updateVotingSession(
  id: string,
  data: Partial<VotingSessionFormData>
): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return updateLocalVotingSession(id, data);
  }

  try {
    const existing = await getVotingSession(id);
    if (!existing.success || !existing.data) {
      return { success: false, error: 'Szavazás nem található' };
    }

    const willBeActive = data.isActive ?? existing.data.isActive;

    // Enforce single active session.
    if (willBeActive) {
      await deactivateAllSessions(id);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.fromDate(new Date()),
      isActive: willBeActive,
    };
    if (data.title !== undefined) updateData.title = data.title ?? null;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.votepool) {
      updateData.votepool = buildVotepool(data.votepool, existing.data.votepool);
    }

    await updateDoc(doc(firestore, COLLECTION_NAME, id), updateData);
    return getVotingSession(id);
  } catch (error) {
    console.error('Error updating voting session:', error);
    return { success: false, error: 'Hiba a szavazás frissítésekor' };
  }
}

// Delete a voting session.
export async function deleteVotingSession(id: string): Promise<ApiResponse<void>> {
  if (shouldUseMockStorage()) {
    return deleteLocalVotingSession(id);
  }

  try {
    await deleteDoc(doc(firestore, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting voting session:', error);
    return { success: false, error: 'Hiba a szavazás törlésekor' };
  }
}

// Activate a session (and deactivate all others).
export async function setActiveVotingSession(id: string): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return setLocalActiveVotingSession(id);
  }
  return updateVotingSession(id, { isActive: true });
}

// Toggle a session's active state. Activating it deactivates the others.
export async function toggleVotingSessionActive(id: string): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return toggleLocalVotingSessionActive(id);
  }

  const session = await getVotingSession(id);
  if (!session.success || !session.data) {
    return session;
  }
  return updateVotingSession(id, { isActive: !session.data.isActive });
}

// Cast a vote for a topic inside a session's votepool.
export async function voteForVoteTopic(sessionId: string, topicId: string): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return voteLocalVoteTopic(sessionId, topicId);
  }

  try {
    const session = await getVotingSession(sessionId);
    if (!session.success || !session.data) {
      return { success: false, error: 'Szavazás nem található' };
    }

    const votepool = session.data.votepool.map(topic =>
      topic.id === topicId ? { ...topic, votes: topic.votes + 1 } : topic
    );

    await updateDoc(doc(firestore, COLLECTION_NAME, sessionId), {
      votepool,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return getVotingSession(sessionId);
  } catch (error) {
    console.error('Error voting for topic:', error);
    return { success: false, error: 'Hiba a szavazat leadásakor' };
  }
}

// Reset all vote counts in a session's votepool to 0.
export async function resetVotingSessionVotes(sessionId: string): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return resetLocalVotingSessionVotes(sessionId);
  }

  try {
    const session = await getVotingSession(sessionId);
    if (!session.success || !session.data) {
      return { success: false, error: 'Szavazás nem található' };
    }

    const votepool = session.data.votepool.map(topic => ({ ...topic, votes: 0 }));

    await updateDoc(doc(firestore, COLLECTION_NAME, sessionId), {
      votepool,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return getVotingSession(sessionId);
  } catch (error) {
    console.error('Error resetting votes:', error);
    return { success: false, error: 'Hiba a szavazatok nullázásakor' };
  }
}

// Deactivate every session in Firestore, optionally skipping one id.
async function deactivateAllSessions(exceptId?: string): Promise<void> {
  const snapshot = await getDocs(collection(firestore, COLLECTION_NAME));
  await Promise.all(
    snapshot.docs
      .filter(d => d.id !== exceptId && (d.data().isActive as boolean))
      .map(d => updateDoc(doc(firestore, COLLECTION_NAME, d.id), { isActive: false }))
  );
}
