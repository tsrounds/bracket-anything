export const runtime = 'edge';

import Anthropic from '@anthropic-ai/sdk';
import { ContextAnalysisRequest, ContextAnalysisResponse } from '@/app/lib/predict-this/ai-schemas';

const SYSTEM_PROMPT = `You are analyzing a user's request to create a prediction quiz about an event.

Your job is to determine if you have enough information to generate specific prediction questions.

You NEED clarification if:
- It's a sports game without a specific date or matchup (e.g., "Lakers game" needs: date, opponent)
- It's a recurring event without specifying which year/edition (e.g., "the Oscars" needs: year)
- The event name is ambiguous or could refer to multiple things
- Real-time information would be needed to create accurate questions

You DO NOT need clarification if:
- The event is clearly specified with enough context (e.g., "2026 Super Bowl", "March Madness 2026 Final Four")
- It's a one-time well-known event with clear date (e.g., "next US presidential election")

IMPORTANT: Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.

Response format:
{
  "needsClarification": boolean,
  "clarificationQuestions": ["question1", "question2"] (only if needsClarification is true, max 3 questions),
  "suggestedTitle": "string" (always provide a suggested title based on what you know)
}`;

export async function POST(req: Request) {
  try {
    // Parse and validate input
    const body = await req.json();
    const { context } = ContextAnalysisRequest.parse(body);

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Call Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Analyze this event context for a prediction quiz: "${context}"`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse and validate response
    const parsed = JSON.parse(textContent.text);
    const result = ContextAnalysisResponse.parse(parsed);

    return Response.json(result);
  } catch (error) {
    console.error('Quiz Analysis Error:', error);

    // Return error response
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'Failed to analyze quiz context' },
      { status: 500 }
    );
  }
}
