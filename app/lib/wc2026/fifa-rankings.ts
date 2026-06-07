// FIFA Men's World Ranking snapshot.
// Source: https://inside.fifa.com/fifa-world-ranking/men
// Date pulled: TBD — replace this when the file is filled in.
//
// Schema is: rank (lower = better), name (display), code (3-letter FIFA tri-code).
// The snapshot lives in a TS object instead of JSON so importers get type-checking
// and the build catches typos in tri-codes used elsewhere in app/lib/wc2026.

export interface FifaRank {
  rank: number;
  name: string;
  code: string;          // FIFA tri-code, e.g. 'USA', 'BRA'
}

export const FIFA_RANKING_AS_OF = '2026-04-01';

// Full ranking ordered by rank ascending. Keep entries one per line for diffability.
// TODO: replace with the full official list (~211 teams) before launch.
export const FIFA_RANKING: FifaRank[] = [
  // top of the table, derived from public reporting on the April 2026 update.
  { rank: 1,  name: 'France',         code: 'FRA' },
  { rank: 2,  name: 'Spain',          code: 'ESP' },
  { rank: 3,  name: 'Argentina',      code: 'ARG' },
  { rank: 4,  name: 'England',        code: 'ENG' },
  { rank: 5,  name: 'Portugal',       code: 'POR' },
  { rank: 6,  name: 'Brazil',         code: 'BRA' },
  // …
  { rank: 15, name: 'Mexico',         code: 'MEX' },
  { rank: 16, name: 'United States',  code: 'USA' },
  { rank: 30, name: 'Canada',         code: 'CAN' },
];

// Reverse index for O(1) lookups by tri-code.
export const FIFA_RANK_BY_CODE: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const row of FIFA_RANKING) out[row.code] = row.rank;
  return out;
})();

// Reverse index for display name lookups.
export const FIFA_NAME_BY_CODE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const row of FIFA_RANKING) out[row.code] = row.name;
  return out;
})();
