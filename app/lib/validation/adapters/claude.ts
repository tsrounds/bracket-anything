import Anthropic from '@anthropic-ai/sdk';
import { MatchedAnswer, QuizQuestion } from '../types';

const SYSTEM_PROMPT = `You are answering questions about a real-world event for a prediction quiz app. The user will give you:
1. A quiz title that describes the event (e.g., "Celtics vs Mavericks - February 3, 2026")
2. A list of questions about that event

Your task is to provide the ACTUAL RESULTS of this event. Use web search to find the real outcomes.

For each question, provide:
- The correct answer based on the actual event results
- A confidence level (0.0 to 1.0):
  - 0.95: You found verified results from reliable sources
  - 0.7-0.8: You found results but want user to verify
  - 0.4-0.6: You found partial information
  - 0.0: Event hasn't happened yet or no results found
- A brief reason explaining where you found this information

For multiple-choice questions, you MUST pick one of the provided options exactly as written.
For open-ended questions, provide a concise factual answer.

IMPORTANT:
- Search the web for actual event results, scores, winners, statistics
- If this is a sports game, find the final score and game stats
- If this is an awards show, find the actual winners
- Only set confidence to 0 if the event genuinely hasn't happened yet

Respond with valid JSON only, no markdown:
{
  "answers": [
    {
      "questionId": "string",
      "answer": "string",
      "confidence": number,
      "reason": "string"
    }
  ]
}`;

interface ClaudeAnswer {
  questionId: string;
  answer: string;
  confidence: number;
  reason: string;
}

interface ClaudeResponse {
  answers: ClaudeAnswer[];
}

export async function fetchClaudeAnswers(
  quizTitle: string,
  questions: QuizQuestion[]
): Promise<MatchedAnswer[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('AI service not configured');
  }

  const client = new Anthropic({ apiKey });

  const questionsText = questions.map((q, i) => {
    let text = `${i + 1}. [ID: ${q.id}] ${q.text}`;
    if (q.type === 'multiple' && q.options) {
      text += `\n   Options: ${q.options.join(' | ')}`;
    } else {
      text += `\n   (Open-ended answer)`;
    }
    return text;
  }).join('\n\n');

  const userPrompt = `Quiz: "${quizTitle}"

Questions:
${questionsText}

Answer each question based on your knowledge of this event.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5,
      },
    ],
  });

  // Extract text content from response - may have multiple text blocks due to web search
  const textBlocks = response.content.filter((block): block is Anthropic.TextBlock => block.type === 'text');
  if (textBlocks.length === 0) {
    throw new Error('No text response from Claude');
  }

  // Combine all text blocks and find the JSON
  const fullText = textBlocks.map(b => b.text).join('\n');

  // Extract JSON from the response (it might be surrounded by other text)
  const jsonMatch = fullText.match(/\{[\s\S]*"answers"[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Claude response did not contain expected JSON:', fullText.substring(0, 500));
    throw new Error('AI response did not contain expected answer format');
  }

  let parsed: ClaudeResponse;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error('Failed to parse JSON from Claude:', jsonMatch[0].substring(0, 500));
    throw new Error('Failed to parse AI response');
  }

  if (!parsed.answers || !Array.isArray(parsed.answers)) {
    throw new Error('Invalid AI response format');
  }

  // Map Claude's response to MatchedAnswer format
  const matches: MatchedAnswer[] = questions.map((question) => {
    const claudeAnswer = parsed.answers.find(a => a.questionId === question.id);

    if (!claudeAnswer) {
      return {
        questionId: question.id,
        questionText: question.text,
        suggestedAnswer: '',
        confidence: 0,
        source: 'AI could not find this question',
      };
    }

    // For multiple choice, validate the answer is one of the options
    let finalAnswer = claudeAnswer.answer;
    let finalConfidence = claudeAnswer.confidence;

    if (question.type === 'multiple' && question.options) {
      const matchingOption = question.options.find(
        opt => opt.toLowerCase() === claudeAnswer.answer.toLowerCase()
      );
      if (matchingOption) {
        finalAnswer = matchingOption; // Use exact casing from options
      } else if (claudeAnswer.answer && claudeAnswer.confidence > 0) {
        // Claude gave an answer but it doesn't match options - reduce confidence
        finalConfidence = Math.min(finalConfidence, 0.5);
      }
    }

    return {
      questionId: question.id,
      questionText: question.text,
      suggestedAnswer: finalAnswer,
      confidence: finalConfidence,
      source: claudeAnswer.reason ? `AI: ${claudeAnswer.reason}` : 'AI-generated answer',
      alternatives: question.type === 'multiple' && question.options
        ? question.options.filter(o => o !== finalAnswer)
        : undefined,
    };
  });

  return matches;
}
