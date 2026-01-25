export const runtime = 'edge';

import Anthropic from '@anthropic-ai/sdk';
import { ZodError } from 'zod';
import { QuizGenerationRequest, QuizGenerationResponse } from '@/app/lib/predict-this/ai-schemas';

const SYSTEM_PROMPT = `You are creating a prediction quiz about an event. Your job is to generate engaging prediction questions that users will answer BEFORE the event happens.

GUIDELINES:
1. Generate exactly 10 prediction-focused questions
2. Use a mix of question types:
   - 7 multiple choice questions (with 4-6 realistic options each)
   - 3 open-ended questions (for numeric predictions, specific names, etc.)
3. Each question should:
   - Ask users to PREDICT an outcome before it happens
   - Be specific and verifiable after the event
   - All questions should have points: 1 (the user will adjust if needed)
4. For multiple choice questions:
   - Provide realistic, balanced options
   - Include likely outcomes and some surprises
   - Don't make one option obviously correct
5. For open-ended questions:
   - Focus on quantifiable predictions (numbers, names, specific outcomes)
   - Ask for things like: final scores, specific winners, totals, etc.

DEADLINE CALCULATION:
- Suggest a deadline that is typically 1 day before the event starts
- Use ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
- If the event date is unclear, suggest a reasonable deadline based on context

IMPORTANT: Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.

Response format:
{
  "title": "Quiz title based on the event",
  "deadline": "ISO 8601 datetime string",
  "questions": [
    {
      "id": "q1",
      "type": "multiple",
      "text": "Question text?",
      "points": 1,
      "options": ["Option A", "Option B", "Option C", "Option D"]
    },
    {
      "id": "q2",
      "type": "open",
      "text": "Open-ended question?",
      "points": 1
    }
  ]
}`;

export async function POST(req: Request) {
  try {
    // Parse and validate input
    const body = await req.json();
    const { context, clarifications } = QuizGenerationRequest.parse(body);

    // Build user prompt
    let userPrompt = `Create a prediction quiz about: "${context}"`;

    if (clarifications && Object.keys(clarifications).length > 0) {
      userPrompt += '\n\nAdditional context from user:';
      for (const [question, answer] of Object.entries(clarifications)) {
        userPrompt += `\n- ${question}: ${answer}`;
      }
    }

    userPrompt += '\n\nGenerate exactly 10 prediction questions (7 multiple choice, 3 open-ended).';

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables');
      return Response.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey,
    });

    // Call Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
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
    const result = QuizGenerationResponse.parse(parsed);

    return Response.json(result);
  } catch (error) {
    console.error('Quiz Generation Error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || 'Invalid input';
      return Response.json(
        { error: message },
        { status: 400 }
      );
    }

    // Return error response
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
