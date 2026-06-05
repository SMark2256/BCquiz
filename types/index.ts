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

// Poll Option within a Poll container
export interface PollOption {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  votes: number;
}

// Poll Container - contains 4-6 options as a nested map
export interface Poll {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  options: Record<string, PollOption>; // Map of optionId -> PollOption
  createdAt: Date;
  updatedAt: Date;
}

// Legacy VoteTopic for backwards compatibility (will be migrated)
export interface VoteTopic {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  votes: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId?: string; // Optional: for authenticated voting
  createdAt: Date;
}

// Form types for creating/updating
export type QuizFormData = Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>;
export type EventFormData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
export type VoteTopicFormData = Omit<VoteTopic, 'id' | 'votes' | 'createdAt'>;

// Poll form data - options without votes (votes start at 0)
export interface PollOptionFormData {
  id?: string; // Optional - generated if not provided
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface PollFormData {
  title: string;
  description?: string;
  isActive: boolean;
  options: PollOptionFormData[];
}

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
