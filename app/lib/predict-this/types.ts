// Type definitions for Predict This feature
// Note: Reuses existing quiz structure from /bracket with added creatorId field

export interface Question {
  id: string;
  type: 'multiple' | 'open';
  text: string;
  points: number;
  options?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  status: 'in-progress' | 'completed';
  questions: Question[];
  coverImage?: string;
  deadline: string;
  creatorId?: string;                 // Added for predict-this user tracking
  creatorName?: string;               // Added for predict-this user tracking
  creatorAvatar?: string;             // Added for predict-this user tracking
  correctAnswers?: Record<string, string | string[]>;
  completedAt?: string;
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  answers: Record<string, string>;
  submittedAt: string;
  score?: number;
  totalQuestions?: number;
  totalAnswered?: number;
}
