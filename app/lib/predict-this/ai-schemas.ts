import { z } from 'zod';

// Request to analyze context and check if clarification needed
export const ContextAnalysisRequest = z.object({
  context: z.string().min(5, 'Please provide more detail about the event').max(500),
});

// Response indicating whether clarification is needed
export const ContextAnalysisResponse = z.object({
  needsClarification: z.boolean(),
  clarificationQuestions: z.array(z.string()).optional(),
  suggestedTitle: z.string().optional(),
});

// Request to generate full quiz (with optional clarifications)
export const QuizGenerationRequest = z.object({
  context: z.string().min(5).max(500),
  clarifications: z.record(z.string(), z.string()).optional(),
});

// AI-generated question schema
export const AIGeneratedQuestion = z.object({
  id: z.string(),
  type: z.enum(['multiple', 'open']),
  text: z.string().min(10),
  points: z.number().int().min(1).max(3),
  options: z.array(z.string()).min(2).max(6).optional(),
});

// Full quiz generation response
export const QuizGenerationResponse = z.object({
  title: z.string().min(5).max(200),
  deadline: z.string(), // ISO datetime suggestion
  questions: z.array(AIGeneratedQuestion).min(1).max(15),
});

// Type exports
export type ContextAnalysisRequestType = z.infer<typeof ContextAnalysisRequest>;
export type ContextAnalysisResponseType = z.infer<typeof ContextAnalysisResponse>;
export type QuizGenerationRequestType = z.infer<typeof QuizGenerationRequest>;
export type QuizGenerationResponseType = z.infer<typeof QuizGenerationResponse>;
export type AIGeneratedQuestionType = z.infer<typeof AIGeneratedQuestion>;

// Interface for AI-generated quiz data (used in components)
export interface AIGeneratedQuiz {
  title: string;
  deadline: string;
  questions: AIGeneratedQuestionType[];
}
