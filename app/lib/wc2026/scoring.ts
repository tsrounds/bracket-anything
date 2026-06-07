// Pure scoring function for WC 2026 entries.
// Advancement-based: a knockout pick scores if that team actually reached
// the slot's round in reality, regardless of the path the user predicted.

import { POINTS } from './constants';
import {
  Entry,
  GROUP_IDS,
  Round,
  ScoreBreakdown,
  TournamentState,
  USMNT_CEILING_ORDER,
  USMNTCeiling,
} from './types';

const KNOCKOUT_ROUNDS = ['R32', 'R16', 'QF', 'SF', 'F'] as const;
type KnockoutRound = (typeof KNOCKOUT_ROUNDS)[number];

const emptyBreakdown = (): ScoreBreakdown => ({
  groupStage: 0,
  wildcards: 0,
  R32: 0,
  R16: 0,
  QF:  0,
  SF:  0,
  F:   0,
  championBonus: 0,
  props: 0,
  total: 0,
});

export function scoreEntry(entry: Entry, state: TournamentState): ScoreBreakdown {
  const breakdown = emptyBreakdown();

  breakdown.groupStage = scoreGroupStage(entry, state);
  breakdown.wildcards  = scoreWildcards(entry, state);

  for (const round of KNOCKOUT_ROUNDS) {
    breakdown[round] = scoreKnockoutRound(entry, state, round);
  }
  breakdown.championBonus = scoreChampionBonus(entry, state);
  breakdown.props = scoreProps(entry, state);

  breakdown.total =
    breakdown.groupStage +
    breakdown.wildcards +
    breakdown.R32 + breakdown.R16 + breakdown.QF + breakdown.SF + breakdown.F +
    breakdown.championBonus +
    breakdown.props;

  return breakdown;
}

// ---- Group stage ---------------------------------------------------------

function scoreGroupStage(entry: Entry, state: TournamentState): number {
  let pts = 0;
  for (const gid of GROUP_IDS) {
    const picks = entry.groupRanks[gid];
    const standing = state.standings[gid];
    if (!picks || picks.length !== 4 || !standing) continue;

    const qualified = new Set(standing.qualified);

    // Slot 1 (predicted group winner)
    if (picks[0] === standing.ranking[0]) {
      pts += POINTS.group.correctFirst;
    } else if (qualified.has(picks[0])) {
      pts += POINTS.group.qualifierConsolation;
    }

    // Slot 2 (predicted runner-up)
    if (picks[1] === standing.ranking[1]) {
      pts += POINTS.group.correctSecond;
    } else if (qualified.has(picks[1])) {
      pts += POINTS.group.qualifierConsolation;
    }
  }
  return pts;
}

// Wildcard: 2pt per starred team that finished exactly 3rd in its group AND
// was one of the top 8 third-place qualifiers.
function scoreWildcards(entry: Entry, state: TournamentState): number {
  const wildcardSet = new Set(state.wildcards);
  let pts = 0;

  for (const teamCode of entry.wildcards) {
    if (!wildcardSet.has(teamCode)) continue;

    // Confirm team finished exactly 3rd in its group.
    const group = Object.values(state.standings).find((s) =>
      s?.ranking.includes(teamCode),
    );
    if (group && group.third === teamCode) {
      pts += POINTS.group.correctWildcard;
    }
  }
  return pts;
}

// ---- Knockout (advancement-based) ---------------------------------------

function scoreKnockoutRound(
  entry: Entry,
  state: TournamentState,
  round: KnockoutRound,
): number {
  const picks = entry.knockoutPicks[round] ?? [];
  const advancers = new Set(state.advancers[round]);
  if (advancers.size === 0) return 0;

  // Each unique team in the user's slot list that actually reached the round.
  // (Duplicates in `picks` would be invalid input; we de-dupe defensively.)
  const seen = new Set<string>();
  let hits = 0;
  for (const team of picks) {
    if (!team || seen.has(team)) continue;
    seen.add(team);
    if (advancers.has(team)) hits++;
  }
  return hits * POINTS.knockout[round];
}

function scoreChampionBonus(entry: Entry, state: TournamentState): number {
  if (!entry.knockoutPicks.champion || !state.advancers.champion) return 0;
  return entry.knockoutPicks.champion === state.advancers.champion
    ? POINTS.knockout.championBonus
    : 0;
}

// ---- Props ---------------------------------------------------------------

function scoreProps(entry: Entry, state: TournamentState): number {
  let pts = 0;

  // Golden Boot — exact match on player id.
  if (
    entry.props.goldenBoot &&
    state.goldenBoot &&
    entry.props.goldenBoot === state.goldenBoot
  ) {
    pts += POINTS.props.goldenBoot;
  }

  // Dark horse — tiered by furthest round reached.
  if (entry.props.darkHorse) {
    const reached = furthestRoundReached(entry.props.darkHorse, state);
    if (reached) {
      pts += darkHorsePointsFor(reached);
    }
  }

  // USMNT ceiling — exact or off-by-one.
  if (entry.props.usmntCeiling) {
    const actual = usmntActualCeiling(state);
    if (actual) {
      const diff = ceilingDistance(entry.props.usmntCeiling, actual);
      if (diff === 0) pts += POINTS.props.usmntExact;
      else if (diff === 1) pts += POINTS.props.usmntOff;
    }
  }

  // Biggest upset — lowest-FIFA-rank team to advance from groups.
  if (
    entry.props.biggestUpset &&
    state.lowestRankedAdvancer &&
    entry.props.biggestUpset === state.lowestRankedAdvancer
  ) {
    pts += POINTS.props.biggestUpset;
  }

  // Total goals — within ±5 or ±10.
  if (entry.props.totalGoals != null && state.totalGoals != null) {
    const diff = Math.abs(entry.props.totalGoals - state.totalGoals);
    if (diff <= 5) pts += POINTS.props.totalGoalsWithin5;
    else if (diff <= 10) pts += POINTS.props.totalGoalsWithin10;
  }

  // Pool wildcard — host-judged. Award full pts if entry matches resolved
  // answer (string compare, trimmed, case-insensitive).
  // The resolved answer lives on the pool doc; the scorer accepts it via
  // state.resolvedProps if the caller chose to merge it in. To keep this
  // engine pure we treat a non-null state.totalGoals+goldenBoot etc. as
  // signals — wildcard answer is handled by passing it through state.
  // We store host-resolved wildcard answer on state via the optional field
  // below (see TournamentState extension at runtime).
  const resolvedWildcard = (state as TournamentState & {
    wildcardAnswer?: string | null;
  }).wildcardAnswer;
  if (
    entry.props.wildcardAnswer &&
    resolvedWildcard &&
    normalize(entry.props.wildcardAnswer) === normalize(resolvedWildcard)
  ) {
    pts += POINTS.props.wildcardAnswer;
  }

  return pts;
}

function darkHorsePointsFor(round: Round): number {
  // Spec: 10/15/20/25 for R16/QF/SF/Final or better. Champion caps at 25.
  switch (round) {
    case 'R16': return POINTS.props.darkHorse.R16;
    case 'QF':  return POINTS.props.darkHorse.QF;
    case 'SF':  return POINTS.props.darkHorse.SF;
    case 'F':   return POINTS.props.darkHorse.F;
    default:    return 0;          // R32 only or eliminated in groups
  }
}

function furthestRoundReached(
  team: string,
  state: TournamentState,
): Round | null {
  // Walk from latest to earliest so we return the deepest.
  if (state.advancers.champion === team) return 'F'; // capped at final tier
  if (state.advancers.F.includes(team))  return 'F';
  if (state.advancers.SF.includes(team)) return 'SF';
  if (state.advancers.QF.includes(team)) return 'QF';
  if (state.advancers.R16.includes(team)) return 'R16';
  if (state.advancers.R32.includes(team)) return 'R32';
  return null;
}

function usmntActualCeiling(state: TournamentState): USMNTCeiling | null {
  const code = 'USA';
  if (state.advancers.champion === code) return 'Champion';
  if (state.advancers.F.includes(code))  return 'F';
  if (state.advancers.SF.includes(code)) return 'SF';
  if (state.advancers.QF.includes(code)) return 'QF';
  if (state.advancers.R16.includes(code)) return 'R16';
  if (state.advancers.R32.includes(code)) return 'R32';

  // If the group stage has fully resolved and USA didn't advance, ceiling = Groups.
  const allStandings = Object.values(state.standings);
  if (allStandings.length === GROUP_IDS.length) return 'Groups';

  return null; // tournament hasn't progressed far enough yet
}

function ceilingDistance(a: USMNTCeiling, b: USMNTCeiling): number {
  return Math.abs(USMNT_CEILING_ORDER.indexOf(a) - USMNT_CEILING_ORDER.indexOf(b));
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}
