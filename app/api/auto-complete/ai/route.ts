import { ZodError } from 'zod';
import { AIValidateRequestSchema, ValidationResult } from '@/app/lib/validation/types';
import { fetchClaudeAnswers } from '@/app/lib/validation/adapters/claude';
import { calculateOverallConfidence } from '@/app/lib/validation/confidence';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quizTitle, questions } = AIValidateRequestSchema.parse(body);

    const matches = await fetchClaudeAnswers(quizTitle, questions);

    const overallConfidence = calculateOverallConfidence(matches);
    const unmatchedQuestions = matches
      .filter(m => m.confidence === 0)
      .map(m => m.questionId);

    const result: ValidationResult = {
      eventTitle: quizTitle,
      source: 'Claude AI',
      matches,
      overallConfidence,
      unmatchedQuestions,
    };

    return Response.json(result);
  } catch (error) {
    console.error('Auto-complete AI error:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'AI service not configured') {
        return Response.json(
          { error: 'AI service not configured. Please contact support.' },
          { status: 503 }
        );
      }
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'Failed to get AI answers' },
      { status: 500 }
    );
  }
}
