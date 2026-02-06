import { ZodError } from 'zod';
import { ValidateRequestSchema, ValidationResult } from '@/app/lib/validation/types';
import { fetchSportsEventData } from '@/app/lib/validation/adapters/sports';
import { fetchWikipediaEventData } from '@/app/lib/validation/adapters/wikipedia';
import { calculateOverallConfidence } from '@/app/lib/validation/confidence';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, category, questions, source, metadata } = ValidateRequestSchema.parse(body);

    let matches;
    let eventTitle: string;

    if (source === 'thesportsdb') {
      const result = await fetchSportsEventData(eventId, questions);
      matches = result.matches;
      eventTitle = result.eventTitle;
    } else {
      const pageTitle = metadata.pageTitle || eventId;
      const result = await fetchWikipediaEventData(pageTitle, questions);
      matches = result.matches;
      eventTitle = result.eventTitle;
    }

    const overallConfidence = calculateOverallConfidence(matches);
    const unmatchedQuestions = matches
      .filter(m => m.confidence === 0)
      .map(m => m.questionId);

    const result: ValidationResult = {
      eventTitle,
      source: source === 'thesportsdb' ? 'TheSportsDB' : 'Wikipedia',
      matches,
      overallConfidence,
      unmatchedQuestions,
    };

    return Response.json(result);
  } catch (error) {
    console.error('Auto-complete validate error:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'Failed to validate answers' },
      { status: 500 }
    );
  }
}
