import { EventSearchResult, MatchedAnswer, QuizQuestion } from '../types';
import { fuzzyMatch, matchToOptions, normalizeText } from '../confidence';

export async function searchWikipediaEvents(query: string): Promise<EventSearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=10&format=json&origin=*`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Wikipedia search failed: ${response.status}`);
  }

  const data = await response.json();
  // OpenSearch returns [query, titles[], descriptions[], urls[]]
  const titles: string[] = data[1] || [];
  const descriptions: string[] = data[2] || [];

  return titles.map((title, i) => ({
    id: title,
    title,
    category: 'awards' as const, // category is set by the caller's context
    source: 'wikipedia' as const,
    metadata: { pageTitle: title, description: descriptions[i] || '' },
  }));
}

interface FactEntry {
  category: string;
  value: string;
  isBold: boolean;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').trim();
}

function extractBoldText(html: string): string | null {
  // Match <b>text</b> or <b><a ...>text</a></b>
  const boldMatch = html.match(/<b[^>]*>(.*?)<\/b>/i);
  if (!boldMatch) return null;
  return stripHtmlTags(boldMatch[1]);
}

function parseWikipediaHtml(html: string): FactEntry[] {
  const facts: FactEntry[] = [];

  // Strategy 1: Parse tables for award categories and winners
  // Look for table rows with category and bold winner text
  const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = tableRowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1]);
    }

    if (cells.length >= 2) {
      // Check if any cell has bold text (winner indicator)
      for (let i = 0; i < cells.length; i++) {
        const boldText = extractBoldText(cells[i]);
        if (boldText) {
          // Use the first cell or a header-like cell as the category
          const categoryCell = i === 0 ? (cells[1] ? stripHtmlTags(cells[0]) : '') : stripHtmlTags(cells[0]);
          if (categoryCell) {
            facts.push({
              category: categoryCell,
              value: boldText,
              isBold: true,
            });
          }
        }
      }
    }
  }

  // Strategy 2: Look for heading + list patterns (e.g., == Best Picture == \n * '''Winner''')
  const sectionRegex = /<h[2-4][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/h[2-4]>([\s\S]*?)(?=<h[2-4]|$)/gi;
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(html)) !== null) {
    const heading = stripHtmlTags(sectionMatch[1]);
    const content = sectionMatch[2];

    // Find bold text in list items within this section
    const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    let firstBold: string | null = null;

    while ((liMatch = listItemRegex.exec(content)) !== null) {
      const bold = extractBoldText(liMatch[1]);
      if (bold && !firstBold) {
        firstBold = bold;
        break; // First bold item in a list is usually the winner
      }
    }

    if (heading && firstBold) {
      facts.push({
        category: heading,
        value: firstBold,
        isBold: true,
      });
    }
  }

  // Strategy 3: Look for "winner" class or style="background" in table cells
  const winnerRowRegex = /<tr[^>]*(?:class="[^"]*winner[^"]*"|style="[^"]*background[^"]*(?:#[fF]{2}[eE]|gold|yellow)[^"]*")[^>]*>([\s\S]*?)<\/tr>/gi;
  let winnerMatch;

  while ((winnerMatch = winnerRowRegex.exec(html)) !== null) {
    const winnerRow = winnerMatch[1];
    const winnerCells: string[] = [];
    const wCellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let wCellMatch;

    while ((wCellMatch = wCellRegex.exec(winnerRow)) !== null) {
      winnerCells.push(stripHtmlTags(wCellMatch[1]));
    }

    if (winnerCells.length >= 2) {
      facts.push({
        category: winnerCells[0],
        value: winnerCells[1],
        isBold: false,
      });
    }
  }

  return facts;
}

function matchQuestionToFacts(
  question: QuizQuestion,
  facts: FactEntry[]
): MatchedAnswer {
  let bestFact: FactEntry | null = null;
  let bestScore = 0;

  for (const fact of facts) {
    const score = fuzzyMatch(question.text, fact.category);
    if (score > bestScore) {
      bestScore = score;
      bestFact = fact;
    }
  }

  if (!bestFact || bestScore < 0.3) {
    return {
      questionId: question.id,
      questionText: question.text,
      suggestedAnswer: '',
      confidence: 0,
      source: 'No matching data found on Wikipedia',
    };
  }

  const baseConfidence = bestFact.isBold ? 0.85 : 0.7;
  const matchConfidence = bestScore * baseConfidence;

  if (question.type === 'multiple' && question.options) {
    const optionMatch = matchToOptions(bestFact.value, question.options);
    if (optionMatch.bestMatch) {
      return {
        questionId: question.id,
        questionText: question.text,
        suggestedAnswer: optionMatch.bestMatch,
        confidence: Math.min(matchConfidence, optionMatch.confidence),
        source: `Wikipedia: "${bestFact.category}" → "${bestFact.value}"`,
        alternatives: question.options.filter(o => o !== optionMatch.bestMatch),
      };
    }
  }

  return {
    questionId: question.id,
    questionText: question.text,
    suggestedAnswer: bestFact.value,
    confidence: matchConfidence,
    source: `Wikipedia: "${bestFact.category}" → "${bestFact.value}"`,
  };
}

export async function fetchWikipediaEventData(
  pageTitle: string,
  questions: QuizQuestion[]
): Promise<{ matches: MatchedAnswer[]; eventTitle: string }> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&origin=*`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Wikipedia parse failed: ${response.status}`);
  }

  const data = await response.json();
  const html: string = data.parse?.text?.['*'] || '';

  if (!html) {
    throw new Error('No content found for this Wikipedia page');
  }

  const facts = parseWikipediaHtml(html);
  const matches = questions.map(q => matchQuestionToFacts(q, facts));

  return { matches, eventTitle: data.parse?.title || pageTitle };
}
