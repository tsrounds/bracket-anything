// Provider abstraction over a sports data API for WC 2026.
// Default adapter: TheSportsDB. Swap providers by changing the export below.

import { GroupId, Match, Player, Team } from './types';

export interface MatchUpdate {
  matchId: string;
  scoreA: number;
  scoreB: number;
  status: 'scheduled' | 'live' | 'final';
  winner: string | null;
}

export interface SportsAPI {
  getFixtures(): Promise<Match[]>;
  getMatchResult(matchId: string): Promise<MatchUpdate | null>;
  getTeams(): Promise<Team[]>;             // Includes FIFA rank when provider supports it.
  getGoldenBootLeader(): Promise<Player | null>;
  getTotalGoals(): Promise<number>;
}

// ---- TheSportsDB adapter -------------------------------------------------
// Free public endpoints. League id for FIFA World Cup is 4429 on TheSportsDB.
// All endpoints accept GET; the provider returns JSON. We keep network errors
// surfacing as thrown errors — callers (the cron handler) decide what to do.

const TSDB_BASE = process.env.THESPORTSDB_BASE ?? 'https://www.thesportsdb.com/api/v1/json/3';
const TSDB_WC_LEAGUE_ID = '4429'; // FIFA World Cup
const TSDB_WC_SEASON   = '2026';

async function tsdbFetch<T>(path: string): Promise<T> {
  const url = `${TSDB_BASE}${path}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`TheSportsDB ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

interface TsdbEvent {
  idEvent: string;
  strEvent: string;
  dateEvent: string;
  strTime: string | null;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  strLeague: string;
}

interface TsdbEventsResponse  { events: TsdbEvent[] | null; }
interface TsdbResultsResponse { results: TsdbEvent[] | null; }

function parseMatch(e: TsdbEvent, fallbackRound: Match['round'] = 'group'): Match {
  const scoreA = e.intHomeScore == null ? null : Number(e.intHomeScore);
  const scoreB = e.intAwayScore == null ? null : Number(e.intAwayScore);
  const status: Match['status'] =
    e.strStatus === 'Match Finished' || (scoreA != null && scoreB != null)
      ? 'final'
      : 'scheduled';
  const winner =
    status === 'final' && scoreA != null && scoreB != null
      ? scoreA > scoreB ? e.strHomeTeam
      : scoreB > scoreA ? e.strAwayTeam
      : null
      : null;

  return {
    id: e.idEvent,
    round: fallbackRound,
    date: e.dateEvent + (e.strTime ? `T${e.strTime}` : ''),
    teamA: e.strHomeTeam,
    teamB: e.strAwayTeam,
    scoreA,
    scoreB,
    status,
    winner,
  };
}

export const TheSportsDB: SportsAPI = {
  async getFixtures() {
    const data = await tsdbFetch<TsdbEventsResponse>(
      `/eventsseason.php?id=${TSDB_WC_LEAGUE_ID}&s=${TSDB_WC_SEASON}`,
    );
    return (data.events ?? []).map((e) => parseMatch(e));
  },

  async getMatchResult(matchId) {
    const data = await tsdbFetch<TsdbResultsResponse>(`/lookupevent.php?id=${matchId}`);
    const event = (data.results ?? [])[0];
    if (!event) return null;
    const m = parseMatch(event);
    if (m.status !== 'final' || m.scoreA == null || m.scoreB == null) return null;
    return {
      matchId,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      status: 'final',
      winner: m.winner,
    };
  },

  async getTeams() {
    // TheSportsDB free tier does not expose FIFA rankings; we return the
    // tournament teams without rank, and the UI falls back to TEAM_FALLBACK.
    const data = await tsdbFetch<{ teams: Array<{ strTeam: string; strTeamShort: string | null }> | null }>(
      `/search_all_teams.php?l=${encodeURIComponent('FIFA World Cup')}`,
    );
    return (data.teams ?? []).map((t) => ({
      code: t.strTeamShort ?? t.strTeam.slice(0, 3).toUpperCase(),
      name: t.strTeam,
      fifaRank: null,
    }));
  },

  async getGoldenBootLeader() {
    return null; // Not exposed by free tier.
  },

  async getTotalGoals() {
    const fixtures = await this.getFixtures();
    return fixtures.reduce((sum, m) => {
      if (m.status === 'final' && m.scoreA != null && m.scoreB != null) {
        return sum + m.scoreA + m.scoreB;
      }
      return sum;
    }, 0);
  },
};

// Default export. Swap with API-Football or other adapter by changing this
// single line (or wiring via env var inside the implementation files).
export const sportsApi: SportsAPI = TheSportsDB;
