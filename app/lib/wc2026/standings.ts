// Pure helpers that derive group standings, wildcards and round advancers
// from match data. Used by the cron handler — keep free of Firebase/network
// imports so they can be unit-tested.

import { TEAM_FALLBACK } from './constants';
import {
  GROUP_IDS,
  GroupId,
  Match,
  Standing,
  TournamentState,
} from './types';

interface TeamRecord {
  team: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  pts: number;
}

const emptyRecord = (team: string): TeamRecord => ({
  team, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, pts: 0,
});

function gd(r: TeamRecord) { return r.gf - r.ga; }

function compareRecords(a: TeamRecord, b: TeamRecord): number {
  if (b.pts !== a.pts) return b.pts - a.pts;
  if (gd(b) !== gd(a)) return gd(b) - gd(a);
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.team.localeCompare(b.team); // deterministic tiebreaker
}

export function computeGroupStanding(
  groupId: GroupId,
  teams: string[],
  matches: Match[],
): Standing {
  const records = new Map<string, TeamRecord>();
  teams.forEach((t) => records.set(t, emptyRecord(t)));

  for (const m of matches) {
    if (m.status !== 'final' || m.scoreA == null || m.scoreB == null) continue;
    const a = records.get(m.teamA);
    const b = records.get(m.teamB);
    if (!a || !b) continue;
    a.played++; b.played++;
    a.gf += m.scoreA; a.ga += m.scoreB;
    b.gf += m.scoreB; b.ga += m.scoreA;
    if (m.scoreA > m.scoreB) { a.win++; b.loss++; a.pts += 3; }
    else if (m.scoreB > m.scoreA) { b.win++; a.loss++; b.pts += 3; }
    else { a.draw++; b.draw++; a.pts += 1; b.pts += 1; }
  }

  const sorted = Array.from(records.values()).sort(compareRecords);
  const ranking = sorted.map((r) => r.team);
  return {
    groupId,
    ranking,
    qualified: ranking.slice(0, 2),
    third: ranking[2] ?? null,
    computedAt: new Date().toISOString(),
  };
}

// Determine the 8 best 3rd-place teams across all 12 groups.
// Same tiebreakers as group play.
export function computeWildcards(
  standings: Partial<Record<GroupId, Standing>>,
  matches: Match[],
): string[] {
  const thirds: TeamRecord[] = [];
  for (const gid of GROUP_IDS) {
    const s = standings[gid];
    if (!s || !s.third) continue;
    // Rebuild that team's record from matches.
    const rec = emptyRecord(s.third);
    for (const m of matches) {
      if (m.group !== gid) continue;
      if (m.status !== 'final' || m.scoreA == null || m.scoreB == null) continue;
      if (m.teamA === s.third) {
        rec.played++; rec.gf += m.scoreA; rec.ga += m.scoreB;
        if (m.scoreA > m.scoreB) { rec.win++; rec.pts += 3; }
        else if (m.scoreA < m.scoreB) { rec.loss++; }
        else { rec.draw++; rec.pts += 1; }
      } else if (m.teamB === s.third) {
        rec.played++; rec.gf += m.scoreB; rec.ga += m.scoreA;
        if (m.scoreB > m.scoreA) { rec.win++; rec.pts += 3; }
        else if (m.scoreB < m.scoreA) { rec.loss++; }
        else { rec.draw++; rec.pts += 1; }
      }
    }
    thirds.push(rec);
  }
  thirds.sort(compareRecords);
  return thirds.slice(0, 8).map((r) => r.team);
}

// Lowest-FIFA-ranked team that advanced from groups (1st, 2nd, or wildcard).
// Uses fifaRanks lookup; ties broken by alphabetical team code.
export function computeLowestRankedAdvancer(
  standings: Partial<Record<GroupId, Standing>>,
  wildcards: string[],
  fifaRanks: Record<string, number | null>,
): string | null {
  const advancers = new Set<string>();
  for (const gid of GROUP_IDS) {
    const s = standings[gid];
    if (!s) continue;
    s.qualified.forEach((t) => advancers.add(t));
  }
  wildcards.forEach((t) => advancers.add(t));

  let lowest: { team: string; rank: number } | null = null;
  const advancerList = Array.from(advancers);
  for (const team of advancerList) {
    const rank = fifaRanks[team] ?? TEAM_FALLBACK[team]?.fifaRank ?? null;
    if (rank == null) continue;
    if (!lowest || rank > lowest.rank ||
       (rank === lowest.rank && team.localeCompare(lowest.team) < 0)) {
      lowest = { team, rank };
    }
  }
  return lowest?.team ?? null;
}

// Compute which teams reached each knockout round, based on completed matches.
// `round` field on the Match doc is the source of truth for which round a
// match belongs to. A team "reached" a round if there's a match they played
// in that round (regardless of outcome). They "advanced from" a round if
// they won it.
export function computeAdvancers(
  matches: Match[],
): TournamentState['advancers'] {
  const reached = {
    R32: new Set<string>(),
    R16: new Set<string>(),
    QF:  new Set<string>(),
    SF:  new Set<string>(),
    F:   new Set<string>(),
  };
  let champion: string | null = null;

  for (const m of matches) {
    if (m.round === 'group' || m.round === '3rd') continue;
    if (m.round in reached) {
      reached[m.round as keyof typeof reached].add(m.teamA);
      reached[m.round as keyof typeof reached].add(m.teamB);
    }
    if (m.round === 'F' && m.status === 'final' && m.winner) {
      champion = m.winner;
    }
  }

  return {
    R32: Array.from(reached.R32),
    R16: Array.from(reached.R16),
    QF:  Array.from(reached.QF),
    SF:  Array.from(reached.SF),
    F:   Array.from(reached.F),
    champion,
  };
}

// Combine all signals into a TournamentState (caller adds goldenBoot, totalGoals).
export function buildTournamentState(input: {
  matches: Match[];
  groups: Partial<Record<GroupId, string[]>>;
  fifaRanks: Record<string, number | null>;
  goldenBoot: string | null;
  totalGoals: number | null;
  wildcardAnswer?: string | null;
}): TournamentState & { wildcardAnswer?: string | null } {
  const standings: Partial<Record<GroupId, Standing>> = {};
  for (const gid of GROUP_IDS) {
    const teams = input.groups[gid];
    if (!teams || teams.length !== 4) continue;
    const groupMatches = input.matches.filter((m) => m.group === gid);
    standings[gid] = computeGroupStanding(gid, teams, groupMatches);
  }

  const wildcards = computeWildcards(standings, input.matches);
  const lowestRankedAdvancer = computeLowestRankedAdvancer(
    standings, wildcards, input.fifaRanks,
  );
  const advancers = computeAdvancers(input.matches);

  return {
    standings,
    wildcards,
    lowestRankedAdvancer,
    advancers,
    goldenBoot: input.goldenBoot,
    totalGoals: input.totalGoals,
    darkHorseProgress: null,
    updatedAt: new Date().toISOString(),
    wildcardAnswer: input.wildcardAnswer ?? null,
  };
}
