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

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time: string;
  imageUrl?: string;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteTopic {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  votes: number;
  createdAt: Date;
}

export interface Vote {
  id: string;
  topicId: string;
  userId?: string; // Optional: for authenticated voting
  createdAt: Date;
}

// Form types for creating/updating
export type QuizFormData = Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>;
export type EventFormData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
export type VoteTopicFormData = Omit<VoteTopic, 'id' | 'votes' | 'createdAt'>;

// Firebase document converters
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
