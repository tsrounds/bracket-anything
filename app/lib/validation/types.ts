import { z } from 'zod';

export type AutoCompleteCategory = 'sports' | 'awards' | 'tv';

export interface EventSearchResult {
  id: string;
  title: string;
  date?: string;
  category: AutoCompleteCategory;
  source: 'thesportsdb' | 'wikipedia';
  metadata: Record<string, string>;
}

export interface MatchedAnswer {
  questionId: string;
  questionText: string;
  suggestedAnswer: string;
  confidence: number;
  source: string;
  alternatives?: string[];
  isEdited?: boolean;
}

export interface ValidationResult {
  eventTitle: string;
  source: string;
  matches: MatchedAnswer[];
  overallConfidence: number;
  unmatchedQuestions: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple' | 'open';
  text: string;
  points: number;
  options?: string[];
}

// Zod schemas for API validation

export const SearchRequestSchema = z.object({
  query: z.string().min(1),
  category: z.enum(['sports', 'awards', 'tv']),
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const ValidateRequestSchema = z.object({
  eventId: z.string().min(1),
  category: z.enum(['sports', 'awards', 'tv']),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['multiple', 'open']),
    text: z.string(),
    points: z.number(),
    options: z.array(z.string()).optional(),
  })),
  source: z.enum(['thesportsdb', 'wikipedia']),
  metadata: z.record(z.string(), z.string()),
});
export type ValidateRequest = z.infer<typeof ValidateRequestSchema>;

export const AIValidateRequestSchema = z.object({
  quizTitle: z.string().min(1),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['multiple', 'open']),
    text: z.string(),
    points: z.number(),
    options: z.array(z.string()).optional(),
  })),
});
export type AIValidateRequest = z.infer<typeof AIValidateRequestSchema>;
