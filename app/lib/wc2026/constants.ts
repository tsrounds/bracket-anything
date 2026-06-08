// Static reference data for the WC 2026 prediction game.
// Group seed is set from the Dec 2025 official draw — fill in real codes
// before launch. Keep as TBD placeholders until the draw is published.

import { GroupId, Team } from './types';
import { FIFA_NAME_BY_CODE, FIFA_RANK_BY_CODE } from './fifa-rankings';

// WC 2026 group seed. Source: CBS Sports group-stage screenshots from the
// Dec 2025 draw. Teams are listed in draw / pot order (pot 1 first).
export const GROUP_SEED: Record<GroupId, string[]> = {
  A: ['MEX', 'KOR', 'RSA', 'CZE'],
  B: ['CAN', 'SUI', 'QAT', 'BIH'],
  C: ['BRA', 'MAR', 'SCO', 'HAI'],
  D: ['USA', 'AUS', 'PAR', 'TUR'],
  E: ['GER', 'ECU', 'CIV', 'CUW'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'IRN', 'EGY', 'NZL'],
  H: ['ESP', 'URU', 'KSA', 'CPV'],
  I: ['FRA', 'SEN', 'NOR', 'IRQ'],
  J: ['ARG', 'AUT', 'ALG', 'JOR'],
  K: ['POR', 'COL', 'COD', 'UZB'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
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
