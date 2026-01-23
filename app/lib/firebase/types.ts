import { Timestamp } from 'firebase/firestore';

/**
 * Device fingerprint record stored in Firestore
 */
export interface DeviceFingerprint {
  fingerprintHash: string;
  rawFingerprint: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  linkedUsers: string[];
  quizSubmissions: string[];
  metadata: {
    userAgent: string;
    platform: string;
    timezone: string;
  };
}

/**
 * User profile with device fingerprinting and account type
 */
export interface UserProfile {
  name: string;
  phoneNumber: string;
  avatar?: string | null;
  updatedAt: string;
  createdAt: Timestamp;
  deviceFingerprints: string[];
  accountType: 'anonymous' | 'permanent';
  upgradedAt?: Timestamp;
}

/**
 * Quiz registration with device fingerprint
 */
export interface QuizRegistration {
  userId: string;
  name: string;
  phoneNumber: string;
  avatar?: string | null;
  quizId: string;
  createdAt: string;
  deviceFingerprint: string;
}

/**
 * Quiz submission with device fingerprint
 */
export interface Submission {
  userId: string;
  userName: string;
  quizId: string;
  answers: Record<string, string>;
  submittedAt: string;
  totalQuestions?: number;
  totalAnswered?: number;
  score?: number;
  deviceFingerprint: string;
}

/**
 * Quiz question structure
 */
export interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
  type?: 'multiple' | 'open';
}

/**
 * Quiz structure
 */
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  questions: Question[];
  status: 'active' | 'completed' | 'in-progress';
  deadline?: string;
  correctAnswers?: Record<string, string>;
  completedAt?: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
}
