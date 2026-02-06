import { EventSearchResult, MatchedAnswer, QuizQuestion } from '../types';
import { fuzzyMatch, matchToOptions, normalizeText, calculateOverallConfidence } from '../confidence';

interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string;
  intAwayScore?: string;
  strResult?: string;
  strVenue?: string;
  strSeason?: string;
  dateEvent?: string;
  strSport?: string;
  strLeague?: string;
  strDescriptionEN?: string;
  strThumb?: string;
  [key: string]: string | undefined;
}

export async function searchSportsEvents(query: string): Promise<EventSearchResult[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheSportsDB search failed: ${response.status}`);
  }

  const data = await response.json();
  const events: SportsDBEvent[] = data.event || [];

  return events.slice(0, 15).map((event) => ({
    id: event.idEvent,
    title: event.strEvent,
    date: event.dateEvent,
    category: 'sports' as const,
    source: 'thesportsdb' as const,
    metadata: { eventId: event.idEvent },
  }));
}

function buildFactMap(event: SportsDBEvent): Record<string, string> {
  const facts: Record<string, string> = {};

  if (event.strHomeTeam) facts['home team'] = event.strHomeTeam;
  if (event.strAwayTeam) facts['away team'] = event.strAwayTeam;
  if (event.intHomeScore) facts['home score'] = event.intHomeScore;
  if (event.intAwayScore) facts['away score'] = event.intAwayScore;
  if (event.strVenue) facts['venue'] = event.strVenue;
  if (event.strSeason) facts['season'] = event.strSeason;
  if (event.strLeague) facts['league'] = event.strLeague;
  if (event.strSport) facts['sport'] = event.strSport;

  // Derived facts
  if (event.intHomeScore && event.intAwayScore) {
    facts['final score'] = `${event.intHomeScore}-${event.intAwayScore}`;
    facts['score'] = `${event.intHomeScore}-${event.intAwayScore}`;

    const homeScore = parseInt(event.intHomeScore, 10);
    const awayScore = parseInt(event.intAwayScore, 10);
    if (!isNaN(homeScore) && !isNaN(awayScore)) {
      if (homeScore > awayScore && event.strHomeTeam) {
        facts['winner'] = event.strHomeTeam;
        facts['winning team'] = event.strHomeTeam;
        facts['loser'] = event.strAwayTeam || '';
      } else if (awayScore > homeScore && event.strAwayTeam) {
        facts['winner'] = event.strAwayTeam;
        facts['winning team'] = event.strAwayTeam;
        facts['loser'] = event.strHomeTeam || '';
      } else {
        facts['winner'] = 'Draw';
        facts['result'] = 'Draw';
      }
      facts['margin'] = `${Math.abs(homeScore - awayScore)}`;
      facts['total points'] = `${homeScore + awayScore}`;
    }
  }

  if (event.strResult) facts['result'] = event.strResult;

  return facts;
}

// Keywords that hint at what a question is asking about
const QUESTION_PATTERNS: Record<string, string[]> = {
  'winner': ['who won', 'winner', 'winning team', 'champion', 'victorious'],
  'final score': ['final score', 'score', 'what was the score'],
  'home team': ['home team', 'host'],
  'away team': ['away team', 'visitor', 'visiting'],
  'venue': ['venue', 'stadium', 'arena', 'where', 'location', 'played at'],
  'home score': ['home score', 'home points'],
  'away score': ['away score', 'away points'],
  'margin': ['margin', 'by how many', 'point difference', 'spread'],
  'total points': ['total points', 'total score', 'over under', 'combined'],
  'loser': ['loser', 'losing team', 'who lost'],
};

function matchQuestionToFact(
  questionText: string,
  facts: Record<string, string>
): { factKey: string; confidence: number } | null {
  const normQuestion = normalizeText(questionText);

  // Check pattern keywords first for high-confidence matches
  for (const [factKey, patterns] of Object.entries(QUESTION_PATTERNS)) {
    if (facts[factKey] === undefined) continue;
    for (const pattern of patterns) {
      if (normQuestion.includes(pattern)) {
        return { factKey, confidence: 1.0 };
      }
    }
  }

  // Fall back to fuzzy matching question text against fact keys
  let bestKey = '';
  let bestScore = 0;
  for (const factKey of Object.keys(facts)) {
    const score = fuzzyMatch(questionText, factKey);
    if (score > bestScore) {
      bestScore = score;
      bestKey = factKey;
    }
  }

  if (bestScore >= 0.5 && bestKey) {
    return { factKey: bestKey, confidence: bestScore * 0.8 };
  }

  return null;
}

export async function fetchSportsEventData(
  eventId: string,
  questions: QuizQuestion[]
): Promise<{ matches: MatchedAnswer[]; eventTitle: string }> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${encodeURIComponent(eventId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheSportsDB lookup failed: ${response.status}`);
  }

  const data = await response.json();
  const events: SportsDBEvent[] = data.events || [];

  if (events.length === 0) {
    throw new Error('Event not found');
  }

  const event = events[0];
  const facts = buildFactMap(event);
  const matches: MatchedAnswer[] = [];

  for (const question of questions) {
    const factMatch = matchQuestionToFact(question.text, facts);

    if (!factMatch) {
      matches.push({
        questionId: question.id,
        questionText: question.text,
        suggestedAnswer: '',
        confidence: 0,
        source: 'No matching data found in TheSportsDB',
      });
      continue;
    }

    const factValue = facts[factMatch.factKey];

    if (question.type === 'multiple' && question.options) {
      const optionMatch = matchToOptions(factValue, question.options);
      matches.push({
        questionId: question.id,
        questionText: question.text,
        suggestedAnswer: optionMatch.bestMatch || factValue,
        confidence: optionMatch.bestMatch
          ? Math.min(factMatch.confidence, optionMatch.confidence)
          : factMatch.confidence * 0.5,
        source: `TheSportsDB: ${factMatch.factKey} = "${factValue}"`,
        alternatives: optionMatch.bestMatch
          ? question.options.filter(o => o !== optionMatch.bestMatch)
          : undefined,
      });
    } else {
      matches.push({
        questionId: question.id,
        questionText: question.text,
        suggestedAnswer: factValue,
        confidence: factMatch.confidence,
        source: `TheSportsDB: ${factMatch.factKey} = "${factValue}"`,
      });
    }
  }

  return { matches, eventTitle: event.strEvent };
}
