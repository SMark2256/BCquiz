// LocalStorage-based persistence for development/testing without Firebase
import type { Quiz, QuizFormData, VotingSession, VotingSessionFormData, VoteTopic, ApiResponse } from '@/types';

// Create a simple event emitter for storage changes
const storageListeners = new Set<() => void>();

export function notifyStorageChange() {
  storageListeners.forEach(listener => listener());
}

export function subscribeToStorage(callback: () => void) {
  storageListeners.add(callback);
  return () => storageListeners.delete(callback);
}

const STORAGE_KEYS = {
  QUIZZES: 'bcquiz_quizzes',
  VOTING_SESSIONS: 'bcquiz_voting_sessions',
  INITIALIZED: 'bcquiz_initialized',
} as const;

// Check if we should use mock mode
export function isMockMode(): boolean {
  // Use mock mode if NEXT_PUBLIC_USE_LOCAL_MOCK is true OR if Firebase is not configured
  return process.env.NEXT_PUBLIC_USE_LOCAL_MOCK === 'true';
}

// Helper to safely access localStorage (SSR-safe)
function getStorage(): Storage | null {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  return null;
}

// Initialize default data if localStorage is empty
function initializeDefaultData(): void {
  const storage = getStorage();
  if (!storage) return;

  const initialized = storage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized) return;

  const defaultQuizzes: Quiz[] = [
    {
      "title": "The Boys",
      "titleHu": "A fiúk",
      "description": "A sorozat egy olyan korban játszódik, ahol a szuperhősök többsége el van telve celeb státuszával és ez gyakran felelőtlen viselkedéssel párosul, ami a világ biztonságát is veszélybe sodorja. A középpontban egy renegát csapat áll, amely ezekkel a korrupt, elkanászodott hősökkel foglalkozik, s ha kell, likvidálja őket.",
      "date": new Date("2026-06-11T00:00:00.000Z"),
      "time": "20:00",
      "location": "BarCraft Corvin",
      "category": "Sorozat",
      "imageUrl": "https://image.tmdb.org/t/p/w500/V2UjGqe24QJJHyEChd4D1AxmOB.jpg",
      "isActive": true,
      "id": "mock-1780345661264",
      "createdAt": new Date("2026-06-01T20:27:41.264Z"),
      "updatedAt": new Date("2026-06-01T20:27:41.264Z")
    },
    {
      "title": "The Witcher",
      "titleHu": "Vaják",
      "description": "Ríviai Geralt, a felbérelhető, mutálódott szörnyvadász végzete felé sodroudik egy vészterhes világban, ahol az emberek gyakran gonoszabbak a szörnyeknél.",
      "date": new Date("2026-06-19T00:00:00.000Z"),
      "time": "20:00",
      "location": "BarCraft Corvin",
      "category": "Sorozat",
      "imageUrl": "https://image.tmdb.org/t/p/w500/qJU4px38JAEF4iN5sh41EkO2n7x.jpg",
      "isActive": true,
      "id": "mock-1780345667603",
      "createdAt": new Date("2026-06-01T20:27:47.603Z"),
      "updatedAt": new Date("2026-06-01T20:27:47.603Z")
    }
  ];

  storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(defaultQuizzes));
  storage.setItem(STORAGE_KEYS.VOTING_SESSIONS, JSON.stringify(getDefaultVotingSessions()));
  storage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// Parse dates from JSON
function parseQuizDates(quiz: Quiz): Quiz {
  return {
    ...quiz,
    date: new Date(quiz.date),
    createdAt: new Date(quiz.createdAt),
    updatedAt: new Date(quiz.updatedAt),
  };
}

function parseVotingSessionDates(session: VotingSession): VotingSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  };
}

// ============ QUIZ CRUD OPERATIONS ============

export function getLocalQuizzes(): Quiz[] {
  const storage = getStorage();
  if (!storage) return [];

  initializeDefaultData();

  const data = storage.getItem(STORAGE_KEYS.QUIZZES);
  if (!data) return [];

  try {
    const quizzes: Quiz[] = JSON.parse(data);
    return quizzes.map(parseQuizDates).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error('Error parsing local quizzes:', error);
    return [];
  }
}

export function getLocalUpcomingQuizzes(): Quiz[] {
  const now = new Date();
  return getLocalQuizzes().filter(q => new Date(q.date) >= now);
}

export function getLocalQuiz(id: string): Quiz | null {
  const quizzes = getLocalQuizzes();
  return quizzes.find(q => q.id === id) || null;
}

export function createLocalQuiz(data: QuizFormData): ApiResponse<Quiz> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const quizzes = getLocalQuizzes();
    const now = new Date();
    
    const newQuiz: Quiz = {
      id: `mock-${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    
    quizzes.push(newQuiz);
    storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    notifyStorageChange();
    
    return { success: true, data: newQuiz };
  } catch (error) {
    console.error('Error creating local quiz:', error);
    return { success: false, error: 'Hiba történt a kvíz létrehozásakor' };
  }
}

export function updateLocalQuiz(id: string, data: Partial<QuizFormData>): ApiResponse<Quiz> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const quizzes = getLocalQuizzes();
    const index = quizzes.findIndex(q => q.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Kvíz nem található' };
    }
    
    const updatedQuiz: Quiz = {
      ...quizzes[index],
      ...data,
      updatedAt: new Date(),
    };
    
    quizzes[index] = updatedQuiz;
    storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    notifyStorageChange();
    
    return { success: true, data: updatedQuiz };
  } catch (error) {
    console.error('Error updating local quiz:', error);
    return { success: false, error: 'Hiba történt a kvíz frissítésekor' };
  }
}

export function deleteLocalQuiz(id: string): ApiResponse<void> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const quizzes = getLocalQuizzes();
    const filtered = quizzes.filter(q => q.id !== id);
    
    if (filtered.length === quizzes.length) {
      return { success: false, error: 'Kvíz nem található' };
    }
    
    storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(filtered));
    notifyStorageChange();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting local quiz:', error);
    return { success: false, error: 'Hiba történt a kvíz törlésekor' };
  }
}

export function resetLocalData(): void {
  const storage = getStorage();
  if (!storage) return;
  
  storage.removeItem(STORAGE_KEYS.INITIALIZED);
  storage.removeItem(STORAGE_KEYS.QUIZZES);
  storage.removeItem(STORAGE_KEYS.VOTING_SESSIONS);
  
  initializeDefaultData();
  notifyStorageChange();
}

// Clear only quizzes (keep voting sessions)
export function clearLocalQuizzes(): void {
  const storage = getStorage();
  if (!storage) return;
  
  storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([]));
  notifyStorageChange();
}

export function toggleLocalQuizActive(id: string): ApiResponse<Quiz> {
  const quizzes = getLocalQuizzes();
  const index = quizzes.findIndex(q => q.id === id);
  if (index === -1) return { success: false, error: 'Kvíz nem található' };

  const updatedQuiz = { ...quizzes[index], isActive: !quizzes[index].isActive, updatedAt: new Date() };
  quizzes[index] = updatedQuiz;
  getStorage()?.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  notifyStorageChange();
  return { success: true, data: updatedQuiz };
}

// ============ VOTING SESSION CRUD OPERATIONS ============

function getDefaultVotingSessions(): VotingSession[] {
  const now = new Date();
  return [
    {
      id: 'session-default-1',
      title: 'Következő Kvízest Témája',
      description: 'Szavazz, hogy miről szóljon a következő kvízestünk!',
      isActive: true,
      votepool: [
        {
          id: 'topic-1',
          title: 'Rick and Morty',
          description: 'Sci-fi animációs sorozat',
          imageUrl: 'https://image.tmdb.org/t/p/w500/cvhNj9eoRBe5SxjCbQTkh05UP5K.jpg',
          votes: 42,
        },
        {
          id: 'topic-2',
          title: 'The Witcher',
          description: 'Fantasy sorozat',
          imageUrl: 'https://image.tmdb.org/t/p/w500/cZ0d3rtvXPVvuiX22sP79K3Hmjz.jpg',
          votes: 38,
        },
        {
          id: 'topic-3',
          title: 'Stranger Things',
          description: 'Sci-fi horror sorozat',
          imageUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
          votes: 35,
        },
        {
          id: 'topic-4',
          title: 'Avatar: The Last Airbender',
          description: 'Animációs kalandsorozat',
          imageUrl: 'https://image.tmdb.org/t/p/w500/9RQhVb3r3mCMqYVhLoCu4EvuipP.jpg',
          votes: 31,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// Build a votepool (with vote counts) from form data, preserving existing votes by id.
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

export function getLocalVotingSessions(): VotingSession[] {
  const storage = getStorage();
  if (!storage) return [];

  initializeDefaultData();

  const data = storage.getItem(STORAGE_KEYS.VOTING_SESSIONS);
  if (!data) return getDefaultVotingSessions();

  try {
    const sessions: VotingSession[] = JSON.parse(data);
    return sessions
      .map(parseVotingSessionDates)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return getDefaultVotingSessions();
  }
}

export function getLocalVotingSession(id: string): VotingSession | null {
  return getLocalVotingSessions().find(s => s.id === id) || null;
}

function persistSessions(sessions: VotingSession[]): void {
  getStorage()?.setItem(STORAGE_KEYS.VOTING_SESSIONS, JSON.stringify(sessions));
  notifyStorageChange();
}

export function createLocalVotingSession(data: VotingSessionFormData): ApiResponse<VotingSession> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    let sessions = getLocalVotingSessions();
    const now = new Date();

    // Only one session can be active at a time.
    if (data.isActive) {
      sessions = sessions.map(s => ({ ...s, isActive: false }));
    }

    const newSession: VotingSession = {
      id: `session-${Date.now()}`,
      title: data.title,
      description: data.description,
      isActive: data.isActive,
      votepool: buildVotepool(data.votepool),
      createdAt: now,
      updatedAt: now,
    };

    sessions.push(newSession);
    persistSessions(sessions);

    return { success: true, data: newSession };
  } catch (error) {
    console.error('Error creating local voting session:', error);
    return { success: false, error: 'Hiba történt a szavazás létrehozásakor' };
  }
}

export function updateLocalVotingSession(
  id: string,
  data: Partial<VotingSessionFormData>
): ApiResponse<VotingSession> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const sessions = getLocalVotingSessions();
    const index = sessions.findIndex(s => s.id === id);

    if (index === -1) {
      return { success: false, error: 'Szavazás nem található' };
    }

    const existing = sessions[index];
    const willBeActive = data.isActive ?? existing.isActive;

    // Enforce single active session: deactivate others when this one becomes active.
    if (willBeActive) {
      sessions.forEach((s, i) => {
        if (i !== index) s.isActive = false;
      });
    }

    const updated: VotingSession = {
      ...existing,
      title: data.title !== undefined ? data.title : existing.title,
      description: data.description !== undefined ? data.description : existing.description,
      isActive: willBeActive,
      votepool: data.votepool ? buildVotepool(data.votepool, existing.votepool) : existing.votepool,
      updatedAt: new Date(),
    };

    sessions[index] = updated;
    persistSessions(sessions);

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating local voting session:', error);
    return { success: false, error: 'Hiba történt a szavazás frissítésekor' };
  }
}

export function deleteLocalVotingSession(id: string): ApiResponse<void> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const sessions = getLocalVotingSessions();
    const filtered = sessions.filter(s => s.id !== id);

    if (filtered.length === sessions.length) {
      return { success: false, error: 'Szavazás nem található' };
    }

    persistSessions(filtered);
    return { success: true };
  } catch (error) {
    console.error('Error deleting local voting session:', error);
    return { success: false, error: 'Hiba történt a szavazás törlésekor' };
  }
}

// Activate one session and deactivate all others.
export function setLocalActiveVotingSession(id: string): ApiResponse<VotingSession> {
  const sessions = getLocalVotingSessions();
  const target = sessions.find(s => s.id === id);
  if (!target) {
    return { success: false, error: 'Szavazás nem található' };
  }

  sessions.forEach(s => {
    s.isActive = s.id === id;
    s.updatedAt = new Date();
  });
  persistSessions(sessions);

  return { success: true, data: sessions.find(s => s.id === id)! };
}

// Toggle a session's active state (turning on deactivates the others).
export function toggleLocalVotingSessionActive(id: string): ApiResponse<VotingSession> {
  const session = getLocalVotingSession(id);
  if (!session) {
    return { success: false, error: 'Szavazás nem található' };
  }
  return updateLocalVotingSession(id, { isActive: !session.isActive });
}

export function voteLocalVoteTopic(sessionId: string, topicId: string): ApiResponse<VotingSession> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const sessions = getLocalVotingSessions();
    const index = sessions.findIndex(s => s.id === sessionId);

    if (index === -1) {
      return { success: false, error: 'Szavazás nem található' };
    }

    const session = sessions[index];
    const topic = session.votepool.find(t => t.id === topicId);

    if (!topic) {
      return { success: false, error: 'Opció nem található' };
    }

    topic.votes += 1;
    session.updatedAt = new Date();

    persistSessions(sessions);
    return { success: true, data: session };
  } catch (error) {
    console.error('Error voting for topic:', error);
    return { success: false, error: 'Hiba történt a szavazat leadásakor' };
  }
}

export function resetLocalVotingSessionVotes(sessionId: string): ApiResponse<VotingSession> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const sessions = getLocalVotingSessions();
    const index = sessions.findIndex(s => s.id === sessionId);

    if (index === -1) {
      return { success: false, error: 'Szavazás nem található' };
    }

    const session = sessions[index];
    session.votepool.forEach(topic => {
      topic.votes = 0;
    });
    session.updatedAt = new Date();

    persistSessions(sessions);
    return { success: true, data: session };
  } catch (error) {
    console.error('Error resetting votes:', error);
    return { success: false, error: 'Hiba történt a szavazatok nullázásakor' };
  }
}
