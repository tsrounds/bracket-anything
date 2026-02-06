import { ZodError } from 'zod';
import { SearchRequestSchema } from '@/app/lib/validation/types';
import { searchSportsEvents } from '@/app/lib/validation/adapters/sports';
import { searchWikipediaEvents } from '@/app/lib/validation/adapters/wikipedia';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, category } = SearchRequestSchema.parse(body);

    let results;
    if (category === 'sports') {
      results = await searchSportsEvents(query);
    } else {
      results = await searchWikipediaEvents(query);
      // Tag results with the actual category from the request
      results = results.map(r => ({ ...r, category }));
    }

    return Response.json({ results });
  } catch (error) {
    console.error('Auto-complete search error:', error);

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
      { error: 'Failed to search for events' },
      { status: 500 }
    );
  }
}
