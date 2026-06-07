// Domain types for the World Cup 2026 prediction game.
// Kept isolated from the wider predict-this app under app/lib/wc2026/*.

export type GroupId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export const GROUP_IDS: GroupId[] = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export type Round = 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F' | '3rd';

// 32 = 12 winners + 12 runners-up + 8 best 3rd-place teams.
export const WILDCARD_CAP = 8;

export interface Team {
  code: string;          // FIFA tri-code, e.g. 'USA'
  name: string;          // 'United States'
  fifaRank: number | null;
}

export interface Group {
  id: GroupId;
  teams: string[];       // 4 team codes, in draw order
}

// As stored under tournaments/wc2026/matches/{matchId}.
export interface Match {
  id: string;
  round: Round;
  date: string;          // ISO
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: 'scheduled' | 'live' | 'final';
  winner: string | null;
  group?: GroupId;       // for round === 'group'
}

// Per-group results computed from match data.
// `qualified` is the two teams that finished 1st/2nd.
// `third` is the team that finished 3rd (may or may not be a wildcard).
export interface Standing {
  groupId: GroupId;
  ranking: string[];     // 4 team codes, finishing position 1..4
  qualified: string[];   // 2 team codes (positions 1,2)
  third: string | null;
  computedAt?: string;
}

// State doc that aggregates tournament-wide resolved info.
export interface TournamentState {
  // From group stage:
  standings: Partial<Record<GroupId, Standing>>;
  wildcards: string[];                // up to 8 best 3rd-place teams that advanced
  lowestRankedAdvancer: string | null; // for "biggest upset" prop

  // From knockout rounds — which teams reached each round in reality.
  advancers: {
    R32: string[];
    R16: string[];
    QF:  string[];
    SF:  string[];
    F:   string[];
    champion: string | null;
  };

  // From props:
  goldenBoot: string | null;          // player id/name
  totalGoals: number | null;
  darkHorseProgress: Round | null;    // unused; per-entry resolution

  updatedAt: string;
}

// User entry.
export interface Entry {
  id: string;
  userId: string;        // anonymous Firebase uid
  name: string;
  avatar: string | null;
  submittedAt: string | null;
  locked: boolean;
  phaseProgress: 'groups' | 'knockout' | 'props' | 'review' | 'locked';

  groupRanks: Partial<Record<GroupId, string[]>>; // 4 team codes per group
  wildcards: string[];                            // up to 8 starred teams

  knockoutPicks: {
    R32: string[];       // 32 teams in user's R32 order (slots)
    R16: string[];       // 16 teams in user's R16 slots
    QF:  string[];
    SF:  string[];
    F:   string[];       // 2 teams
    champion: string | null;
  };

  props: {
    goldenBoot: string | null;
    darkHorse: string | null;
    usmntCeiling: USMNTCeiling | null;
    biggestUpset: string | null;        // team code: lowest-FIFA-rank team to advance from groups
    totalGoals: number | null;
    wildcardAnswer: string | null;
  };

  score?: ScoreBreakdown;
  lastScoredAt?: string;
}

export type USMNTCeiling = 'Groups' | 'R32' | 'R16' | 'QF' | 'SF' | 'F' | 'Champion';
export const USMNT_CEILING_ORDER: USMNTCeiling[] = ['Groups','R32','R16','QF','SF','F','Champion'];

export interface ScoreBreakdown {
  groupStage: number;
  wildcards: number;
  R32: number;
  R16: number;
  QF:  number;
  SF:  number;
  F:   number;
  championBonus: number;
  props: number;
  total: number;
}

export interface Pool {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  lockAt: string;                       // ISO; defaults to '2026-06-11T00:00:00Z'
  propsConfig: {
    wildcardQuestion: string;
    wildcardAnswer: string | null;
  };
}

// Convenience aliases used across the app.
export interface MatchResult {
  matchId: string;
  scoreA: number;
  scoreB: number;
  winner: string | null;
  status: 'final';
}

export interface Player {
  id: string;
  name: string;
  team?: string;
  goals?: number;
}

export const LOCK_AT_DEFAULT = '2026-06-11T00:00:00Z';
