// LocalStorage-based persistence for development/testing without Firebase
import type { Quiz, QuizFormData, VoteTopic, VoteTopicFormData, ApiResponse } from '@/types';

const STORAGE_KEYS = {
  QUIZZES: 'bcquiz_quizzes',
  VOTE_TOPICS: 'bcquiz_vote_topics',
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

  const now = new Date();
  // Empty array - quizzes will be added manually
  const defaultQuizzes: Quiz[] = [];

  const defaultVoteTopics: VoteTopic[] = [
    {
      id: 'vote-1',
      title: 'Rick and Morty',
      description: 'Sci-fi animációs sorozat',
      imageUrl: 'https://image.tmdb.org/t/p/w500/cvhNj9eoRBe5SxjCbQTkh05UP5K.jpg',
      votes: 42,
      createdAt: now,
    },
    {
      id: 'vote-2',
      title: 'The Witcher',
      description: 'Fantasy sorozat',
      imageUrl: 'https://image.tmdb.org/t/p/w500/cZ0d3rtvXPVvuiX22sP79K3Hmjz.jpg',
      votes: 38,
      createdAt: now,
    },
    {
      id: 'vote-3',
      title: 'Stranger Things',
      description: 'Sci-fi horror sorozat',
      imageUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      votes: 35,
      createdAt: now,
    },
    {
      id: 'vote-4',
      title: 'Avatar: The Last Airbender',
      description: 'Animációs kalandsorozat',
      imageUrl: 'https://image.tmdb.org/t/p/w500/9RQhVb3r3mCMqYVhLoCu4EvuipP.jpg',
      votes: 31,
      createdAt: now,
    },
  ];

  storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(defaultQuizzes));
  storage.setItem(STORAGE_KEYS.VOTE_TOPICS, JSON.stringify(defaultVoteTopics));
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

function parseVoteTopicDates(topic: VoteTopic): VoteTopic {
  return {
    ...topic,
    createdAt: new Date(topic.createdAt),
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
    return quizzes.map(parseQuizDates).sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch {
    return [];
  }
}

export function getLocalUpcomingQuizzes(): Quiz[] {
  const now = new Date();
  return getLocalQuizzes().filter(q => q.isActive && q.date >= now);
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
      ...data,
      id: `mock-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    quizzes.push(newQuiz);
    storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    
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
    return { success: true };
  } catch (error) {
    console.error('Error deleting local quiz:', error);
    return { success: false, error: 'Hiba történt a kvíz törlésekor' };
  }
}

// ============ VOTE TOPIC CRUD OPERATIONS ============

export function getLocalVoteTopics(): VoteTopic[] {
  const storage = getStorage();
  if (!storage) return [];
  
  initializeDefaultData();
  
  const data = storage.getItem(STORAGE_KEYS.VOTE_TOPICS);
  if (!data) return [];
  
  try {
    const topics: VoteTopic[] = JSON.parse(data);
    return topics.map(parseVoteTopicDates).sort((a, b) => b.votes - a.votes);
  } catch {
    return [];
  }
}

export function getLocalVoteTopic(id: string): VoteTopic | null {
  const topics = getLocalVoteTopics();
  return topics.find(t => t.id === id) || null;
}

export function createLocalVoteTopic(data: VoteTopicFormData): ApiResponse<VoteTopic> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const topics = getLocalVoteTopics();
    const newTopic: VoteTopic = {
      ...data,
      id: `vote-${Date.now()}`,
      votes: 0,
      createdAt: new Date(),
    };
    
    topics.push(newTopic);
    storage.setItem(STORAGE_KEYS.VOTE_TOPICS, JSON.stringify(topics));
    
    return { success: true, data: newTopic };
  } catch (error) {
    console.error('Error creating local vote topic:', error);
    return { success: false, error: 'Hiba történt a szavazási téma létrehozásakor' };
  }
}

export function updateLocalVoteTopic(id: string, data: Partial<VoteTopicFormData>): ApiResponse<VoteTopic> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const topics = getLocalVoteTopics();
    const index = topics.findIndex(t => t.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Szavazási téma nem található' };
    }
    
    const updatedTopic: VoteTopic = {
      ...topics[index],
      ...data,
    };
    
    topics[index] = updatedTopic;
    storage.setItem(STORAGE_KEYS.VOTE_TOPICS, JSON.stringify(topics));
    
    return { success: true, data: updatedTopic };
  } catch (error) {
    console.error('Error updating local vote topic:', error);
    return { success: false, error: 'Hiba történt a szavazási téma frissítésekor' };
  }
}

export function deleteLocalVoteTopic(id: string): ApiResponse<void> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const topics = getLocalVoteTopics();
    const filtered = topics.filter(t => t.id !== id);
    
    if (filtered.length === topics.length) {
      return { success: false, error: 'Szavazási téma nem található' };
    }
    
    storage.setItem(STORAGE_KEYS.VOTE_TOPICS, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error deleting local vote topic:', error);
    return { success: false, error: 'Hiba történt a szavazási téma törlésekor' };
  }
}

export function incrementLocalVote(topicId: string): ApiResponse<VoteTopic> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'LocalStorage nem elérhető' };
  }

  try {
    const topics = getLocalVoteTopics();
    const index = topics.findIndex(t => t.id === topicId);
    
    if (index === -1) {
      return { success: false, error: 'Szavazási téma nem található' };
    }
    
    topics[index].votes += 1;
    storage.setItem(STORAGE_KEYS.VOTE_TOPICS, JSON.stringify(topics));
    
    return { success: true, data: topics[index] };
  } catch (error) {
    console.error('Error incrementing vote:', error);
    return { success: false, error: 'Hiba történt a szavazat leadásakor' };
  }
}

// Reset all local data (useful for testing)
export function resetLocalData(): void {
  const storage = getStorage();
  if (!storage) return;
  
  storage.removeItem(STORAGE_KEYS.QUIZZES);
  storage.removeItem(STORAGE_KEYS.VOTE_TOPICS);
  storage.removeItem(STORAGE_KEYS.INITIALIZED);
  initializeDefaultData();
}

// Clear only quizzes (keep vote topics)
export function clearLocalQuizzes(): void {
  const storage = getStorage();
  if (!storage) return;
  
  storage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([]));
}
