import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  where,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { firestore, isFirebaseConfigured, trackQuery } from "@/lib/firebase";
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
} from "../mock-storage";
import type {
  VotingSession,
  VotingSessionFormData,
  VoteTopic,
  ApiResponse,
} from "@/types";
import { votingConverter } from "@/services/voting/voting-converter";

const COLLECTION_NAME = "voting_sessions";
// Lazily build the collection ref so this module is safe to import during
// SSR/prerender even when Firestore isn't initialized yet.
const getVotingCollection = () =>
  collection(firestore, COLLECTION_NAME).withConverter(votingConverter);

// Check if we should use local storage instead of Firebase.
function shouldUseMockStorage(): boolean {
  return isMockMode() || !isFirebaseConfigured();
}

// Helper to convert a Firestore document to a VotingSession.
function documentToVotingSession(doc: {
  id: string;
  data: () => Record<string, unknown>;
}): VotingSession {
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
  items: VotingSessionFormData["votepool"],
  existing: VoteTopic[] = [],
): VoteTopic[] {
  return items.map((item, index) => {
    const id = item.id || `topic-${Date.now()}-${index}`;
    const previous = existing.find((t) => t.id === id);
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
export async function getVotingSessions(): Promise<
  ApiResponse<VotingSession[]>
> {
  if (shouldUseMockStorage()) {
    return { success: true, data: getLocalVotingSessions() };
  }

  try {
    const q = query(
      collection(firestore, COLLECTION_NAME),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await trackQuery("getVotingSessions", () => getDocs(q));

    const sessions = snapshot.docs.map(documentToVotingSession);

    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error fetching voting sessions:", error);
    return { success: false, error: "Hiba a szavazások betöltésekor" };
  }
}

// Get the single active voting session, if any.
export async function getActiveVotingSession(): Promise<
  ApiResponse<VotingSession | null>
> {
  const result = await getVotingSessions();
  if (result.success && result.data) {
    return { success: true, data: result.data.find((s) => s.isActive) ?? null };
  }
  return { success: false, error: result.error };
}

// Check voted
export async function checkUserVoted(sessionId: string, fingerprint: string) {
  const voteDocId = `${sessionId}_${fingerprint}`;
  const voteRef = doc(firestore, "votes", voteDocId);
  const snap = await trackQuery("checkUserVoted", () => getDoc(voteRef));

  if (snap.exists()) {
    return { hasVoted: true, data: snap.data() };
  }
  return { hasVoted: false };
}

// Get a single voting session by id.
export async function getVotingSession(
  id: string,
): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    const session = getLocalVotingSession(id);
    if (session) return { success: true, data: session };
    return { success: false, error: "Szavazás nem található" };
  }

  try {
    const docRef = doc(firestore, COLLECTION_NAME, id);
    const snapshot = await trackQuery("getVotingSession", () => getDoc(docRef));
    if (snapshot.exists()) {
      return {
        success: true,
        data: documentToVotingSession(
          snapshot as { id: string; data: () => Record<string, unknown> },
        ),
      };
    }
    return { success: false, error: "Szavazás nem található" };
  } catch (error) {
    console.error("Error fetching voting session:", error);
    return { success: false, error: "Hiba a szavazás betöltésekor" };
  }
}

// Create a new voting session. Only one session can be active at a time.
export async function createVotingSession(
  data: VotingSessionFormData,
): Promise<ApiResponse<VotingSession>> {
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
    console.error("Error creating voting session:", error);
    return { success: false, error: "Hiba a szavazás létrehozásakor" };
  }
}

// Update an existing voting session.
export async function updateVotingSession(
  id: string,
  data: Partial<VotingSessionFormData>,
): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return updateLocalVotingSession(id, data);
  }

  try {
    const existing = await getVotingSession(id);
    if (!existing.success || !existing.data) {
      return { success: false, error: "Szavazás nem található" };
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
    if (data.description !== undefined)
      updateData.description = data.description ?? null;
    if (data.votepool) {
      updateData.votepool = buildVotepool(
        data.votepool,
        existing.data.votepool,
      );
    }

    await updateDoc(doc(firestore, COLLECTION_NAME, id), updateData);
    return getVotingSession(id);
  } catch (error) {
    console.error("Error updating voting session:", error);
    return { success: false, error: "Hiba a szavazás frissítésekor" };
  }
}

// Segédfüggvény a kapcsolódó szavazatok törléséhez
async function deleteAssociatedVotes(sessionId: string) {
  const batch = writeBatch(firestore);
  const votesQuery = query(
    collection(firestore, "votes"),
    where("sessionId", "==", sessionId),
  );
  const votesSnap = await getDocs(votesQuery);

  votesSnap.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

// Delete a voting session.
export async function deleteVotingSession(id: string) {
  try {
    // 1. Kapcsolódó fingerprint-ek törlése
    await deleteAssociatedVotes(id);
    // 2. Maga a szavazás törlése
    await deleteDoc(doc(firestore, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Hiba a törlés során" };
  }
}

// Activate a session (and deactivate all others).
export async function setActiveVotingSession(
  id: string,
): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return setLocalActiveVotingSession(id);
  }
  return updateVotingSession(id, { isActive: true });
}

// Toggle a session's active state. Activating it deactivates the others.
export async function toggleVotingSessionActive(
  id: string,
): Promise<ApiResponse<VotingSession>> {
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
export async function voteForVoteTopic(
  sessionId: string,
  topicId: string,
  fingerprint: string,
): Promise<ApiResponse<VotingSession>> {
  try {
    // 1. Egyedi azonosító generálása a szavazathoz
    const voteDocId = `${sessionId}_${fingerprint}`;
    const voteRef = doc(firestore, "votes", voteDocId);
    const sessionRef = doc(firestore, COLLECTION_NAME, sessionId);

    // 2. Ellenőrizzük, hogy létezik-e már ez a szavazat az adatbázisban
    return await runTransaction(firestore, async (transaction) => {
      const voteSnap = await transaction.get(voteRef);
      if (voteSnap.exists()) {
        throw new Error("Te már szavaztál ebben a témában!");
      }

      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new Error("Szavazás nem található");
      }

      const sessionData = sessionSnap.data() as VotingSession;
      const votepool = sessionData.votepool.map((topic) =>
        topic.id === topicId
          ? { ...topic, votes: (topic.votes || 0) + 1 }
          : topic,
      );

      // 1. Szavazat rögzítése
      transaction.set(voteRef, {
        sessionId,
        topicId,
        fingerprint,
        timestamp: Timestamp.fromDate(new Date()),
      });

      // 2. Számláló növelése a session-ben
      transaction.update(sessionRef, {
        votepool,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      return { success: true, data: { ...sessionData, votepool } };
    });
  } catch (error: any) {
    console.error("Hiba a szavazáskor:", error);
    return {
      success: false,
      error: error.message || "Hiba történt a szavazat leadásakor.",
    };
  }
}

// Reset all vote counts in a session's votepool to 0.
export async function resetVotingSessionVotes(
  sessionId: string,
): Promise<ApiResponse<VotingSession>> {
  if (shouldUseMockStorage()) {
    return resetLocalVotingSessionVotes(sessionId);
  }

  try {
    // 1. Szavazatok törlése a 'votes' táblából (hogy újra lehessen szavazni)
    await deleteAssociatedVotes(sessionId);

    // 2. Számlálók nullázása a session-ben
    const session = await getVotingSession(sessionId);
    if (!session.success || !session.data) {
      return { success: false, error: "Szavazás nem található" };
    }

    const votepool = session.data.votepool.map((topic) => ({
      ...topic,
      votes: 0,
    }));

    await updateDoc(doc(firestore, COLLECTION_NAME, sessionId), {
      votepool,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return getVotingSession(sessionId);
  } catch (error) {
    console.error("Error resetting votes:", error);
    return { success: false, error: "Hiba a szavazatok nullázásakor" };
  }
}

// Deactivate every session in Firestore, optionally skipping one id.
async function deactivateAllSessions(exceptId?: string): Promise<void> {
  const snapshot = await trackQuery("deactivateAllSessions", () =>
    getDocs(collection(firestore, COLLECTION_NAME)),
  );

  await Promise.all(
    snapshot.docs
      .filter((d) => d.id !== exceptId && (d.data().isActive as boolean))
      .map((d) =>
        updateDoc(doc(firestore, COLLECTION_NAME, d.id), { isActive: false }),
      ),
  );
}

/**
 * Szavazat leadása közvetlenül a Firebase-ben
 */
// export async function voteForTopic(sessionId: string, topicId: string) {
//   const sessionRef = doc(firestore, COLLECTION_NAME, sessionId);
//
//   // Lekérjük a jelenlegi szavazást, hogy módosíthassuk a votepool-t
//   // (Firestore-ban a tömbön belüli objektum módosítása trükkös,
//   // ezért a legegyszerűbb lekérni, módosítani, majd visszamenteni)
//   const result = await getVotingSession(sessionId);
//   if (!result.success || !result.data)
//     throw new Error("Szavazás nem található");
//
//   const updatedVotepool = result.data.votepool.map((topic) => {
//     if (topic.id === topicId) {
//       return { ...topic, votes: topic.votes + 1 };
//     }
//     return topic;
//   });
//
//   await updateDoc(sessionRef, {
//     votepool: updatedVotepool,
//     updatedAt: Timestamp.fromDate(new Date()),
//   });
//
//   return { success: true };
// }

/**
 * Lekéri az összes szavazást a Firebase-ből
 */
export async function fetchVotingSessionsDirectly() {
  const q = query(getVotingCollection(), orderBy("createdAt", "desc"));
  const snapshot = await trackQuery("fetchVotingSessionsDirectly", () =>
    getDocs(q),
  );
  return snapshot.docs.map((doc) => doc.data());
}
