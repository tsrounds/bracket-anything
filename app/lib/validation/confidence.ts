import Fuse from 'fuse.js';
import { MatchedAnswer } from './types';

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

export function fuzzyMatch(candidate: string, target: string): number {
  const normCandidate = normalizeText(candidate);
  const normTarget = normalizeText(target);

  if (normCandidate === normTarget) return 1.0;
  if (normTarget.includes(normCandidate) || normCandidate.includes(normTarget)) return 0.9;

  const fuse = new Fuse([{ text: normTarget }], {
    keys: ['text'],
    includeScore: true,
    threshold: 0.6,
  });

  const results = fuse.search(normCandidate);
  if (results.length === 0) return 0;

  // Fuse score is 0 (perfect) to 1 (worst). Invert it.
  const score = results[0].score ?? 1;
  return Math.max(0, 1 - score);
}

export function matchToOptions(
  candidate: string,
  options: string[]
): { bestMatch: string; confidence: number } {
  if (options.length === 0) {
    return { bestMatch: '', confidence: 0 };
  }

  const normCandidate = normalizeText(candidate);

  // Check for exact match first
  const exactMatch = options.find(o => normalizeText(o) === normCandidate);
  if (exactMatch) {
    return { bestMatch: exactMatch, confidence: 1.0 };
  }

  // Fuzzy match against all options
  const fuse = new Fuse(
    options.map(o => ({ text: o })),
    { keys: ['text'], includeScore: true, threshold: 0.6 }
  );

  const results = fuse.search(normCandidate);
  if (results.length === 0) {
    return { bestMatch: '', confidence: 0 };
  }

  const best = results[0];
  const score = best.score ?? 1;
  const confidence = Math.max(0, 1 - score);

  return {
    bestMatch: best.item.text,
    confidence: Math.min(confidence, 0.85), // cap at 0.85 for fuzzy matches
  };
}

export function calculateOverallConfidence(matches: MatchedAnswer[]): number {
  if (matches.length === 0) return 0;
  const total = matches.reduce((sum, m) => sum + m.confidence, 0);
  return total / matches.length;
}
