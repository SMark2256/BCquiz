// TypeScript interfaces/types for consistent data models

export interface Quiz {
  id: string;
  title: string;
  titleHu?: string; // Hungarian title (e.g., "A Kiábrándult Királylány")
  description?: string;
  date: Date;
  time: string; // e.g., "20:00"
  imageUrl?: string;
  location?: string;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// A single voting option inside a VotingSession's votepool
export interface VoteTopic {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  votes: number;
}

// A created voting. Only ONE VotingSession can be active at a time.
// title/description are optional extras for the admin UI; the public
// widget uses its own fixed heading.
export interface VotingSession {
  id: string;
  title?: string;
  description?: string;
  isActive: boolean;
  votepool: VoteTopic[];
  createdAt: Date;
  updatedAt: Date;
}

// Form types for creating/updating
export type QuizFormData = Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>;

// A votepool entry as edited in the admin form (votes start at 0)
export interface VoteTopicFormData {
  id?: string; // Optional - generated if not provided
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface VotingSessionFormData {
  title?: string;
  description?: string;
  isActive: boolean;
  votepool: VoteTopicFormData[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DbVoteRecord {
  id: string; // sessionId_fingerprint formátum a garantált egyediségért
  sessionId: string;
  topicId: string;
  fingerprint: string;
  timestamp: Date;
}
