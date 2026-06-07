// Static reference data for the WC 2026 prediction game.
// Group seed is set from the Dec 2025 official draw — fill in real codes
// before launch. Keep as TBD placeholders until the draw is published.

import { GroupId, Team } from './types';
import { FIFA_NAME_BY_CODE, FIFA_RANK_BY_CODE } from './fifa-rankings';

// Placeholder group seed. Replace with the actual Dec 2025 draw.
// 48 teams across 12 groups of 4. Codes are FIFA tri-codes.
export const GROUP_SEED: Record<GroupId, string[]> = {
  A: ['MEX', 'TBA1', 'TBA2', 'TBA3'],
  B: ['CAN', 'TBA4', 'TBA5', 'TBA6'],
  C: ['USA', 'TBA7', 'TBA8', 'TBA9'],
  D: ['TBA10', 'TBA11', 'TBA12', 'TBA13'],
  E: ['TBA14', 'TBA15', 'TBA16', 'TBA17'],
  F: ['TBA18', 'TBA19', 'TBA20', 'TBA21'],
  G: ['TBA22', 'TBA23', 'TBA24', 'TBA25'],
  H: ['TBA26', 'TBA27', 'TBA28', 'TBA29'],
  I: ['TBA30', 'TBA31', 'TBA32', 'TBA33'],
  J: ['TBA34', 'TBA35', 'TBA36', 'TBA37'],
  K: ['TBA38', 'TBA39', 'TBA40', 'TBA41'],
  L: ['TBA42', 'TBA43', 'TBA44', 'TBA45'],
};

// Team metadata derived from the FIFA ranking snapshot in ./fifa-rankings.ts.
// The live sports API remains the source of truth at runtime; this fallback
// powers the UI (team rows, dark-horse filter, biggest-upset scoring) when
// the API is unreachable or doesn't expose ranks.
export const TEAM_FALLBACK: Record<string, Pick<Team, 'name' | 'fifaRank'>> = (() => {
  const out: Record<string, Pick<Team, 'name' | 'fifaRank'>> = {};
  for (const code of Object.keys(FIFA_RANK_BY_CODE)) {
    out[code] = {
      name: FIFA_NAME_BY_CODE[code],
      fifaRank: FIFA_RANK_BY_CODE[code],
    };
  }
  return out;
})();

export const USMNT_CODE = 'USA';

// Pre-populated Golden Boot favourites for the player picker.
export const GOLDEN_BOOT_FAVORITES: Array<{ id: string; name: string; team: string }> = [
  { id: 'mbappe',    name: 'Kylian Mbappé',        team: 'FRA' },
  { id: 'haaland',   name: 'Erling Haaland',       team: 'NOR' },
  { id: 'messi',     name: 'Lionel Messi',         team: 'ARG' },
  { id: 'kane',      name: 'Harry Kane',           team: 'ENG' },
  { id: 'vinicius',  name: 'Vinícius Júnior',      team: 'BRA' },
  { id: 'rodrigo',   name: 'Rodrygo',              team: 'BRA' },
  { id: 'lautaro',   name: 'Lautaro Martínez',     team: 'ARG' },
  { id: 'pulisic',   name: 'Christian Pulisic',    team: 'USA' },
  { id: 'lewa',      name: 'Robert Lewandowski',   team: 'POL' },
  { id: 'bellingham',name: 'Jude Bellingham',      team: 'ENG' },
];

export const TOTAL_GOALS_RANGE = { min: 100, max: 250 } as const;

// Scoring point values - centralised so /lib/scoring can stay focused.
export const POINTS = {
  group: {
    correctFirst:      3,
    correctSecond:     2,
    qualifierConsolation: 1,
    correctWildcard:   2,
  },
  knockout: {
    R32: 2,
    R16: 4,
    QF:  8,
    SF:  16,
    F:   24,
    championBonus: 40,
  },
  props: {
    goldenBoot: 25,
    darkHorse: { R16: 10, QF: 15, SF: 20, F: 25 } as Record<string, number>,
    usmntExact: 15,
    usmntOff:   7,
    biggestUpset: 10,
    totalGoalsWithin5:  10,
    totalGoalsWithin10: 5,
    wildcardAnswer: 10,
  },
} as const;
