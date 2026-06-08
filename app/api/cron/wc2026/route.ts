// Vercel cron endpoint for the WC 2026 prediction game.
// Schedule: every 15 minutes during the tournament window (see vercel.json).
//
// Pipeline:
//  1. Pull fixtures from sports API, upsert match docs with latest scores.
//  2. Compute group standings + 8 best 3rd-place wildcards.
//  3. Compute knockout-round advancers.
//  4. Write tournament state doc.
//  5. For every pool: rescore every entry using the pure scoring engine,
//     persist score breakdown back to the entry doc.

import { NextRequest, NextResponse } from 'next/server';
import { sportsApi } from '@/app/lib/wc2026/sports-api';
import {
  getGroupsAdmin,
  getPoolWildcardAnswer,
  listMatches,
  listPoolEntries,
  listPoolIds,
  upsertMatch,
  writeEntryScore,
  writeStandings,
  writeTournamentState,
} from '@/app/lib/wc2026/firestore-admin';
import { buildTournamentState } from '@/app/lib/wc2026/standings';
import { scoreEntry } from '@/app/lib/wc2026/scoring';
import { TEAM_FALLBACK } from '@/app/lib/wc2026/constants';
import { GroupId, Match } from '@/app/lib/wc2026/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  // Vercel cron requests carry an Authorization header derived from CRON_SECRET.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get('authorization');
    if (header !== `Bearer ${secret}`) return unauthorized();
  }

  try {
    const ranSummary = await runPipeline();
    return NextResponse.json({ ok: true, ...ranSummary });
  } catch (err: any) {
    console.error('[wc2026 cron] failure', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}

async function runPipeline() {
  // 1. Ingest fixtures.
  const fixtures = await sportsApi.getFixtures().catch((e) => {
    console.warn('[wc2026 cron] getFixtures failed', e);
    return [] as Match[];
  });

  for (const m of fixtures) await upsertMatch(m);

  // 2. Combine with whatever is already stored (the upsert above is best-effort).
  const allMatches = await listMatches();
  const groups = await getGroupsAdmin();

  // FIFA ranks come from TEAM_FALLBACK for now — when API-Football is wired
  // in, swap this for sportsApi.getTeams() → rank map.
  const fifaRanks: Record<string, number | null> = {};
  for (const [code, meta] of Object.entries(TEAM_FALLBACK)) {
    fifaRanks[code] = meta.fifaRank;
  }

  // 3+4. Build & persist tournament state.
  const goldenBootPlayer = await sportsApi.getGoldenBootLeader().catch(() => null);
  const totalGoals = await sportsApi.getTotalGoals().catch(() => null);

  const state = buildTournamentState({
    matches: allMatches,
    groups,
    fifaRanks,
    goldenBoot: goldenBootPlayer?.id ?? null,
    totalGoals,
  });

  await writeStandings(state.standings);
  await writeTournamentState(state);

  // 5. Rescore all pools.
  const poolIds = await listPoolIds();
  let entriesScored = 0;
  for (const poolId of poolIds) {
    const wildcardAnswer = await getPoolWildcardAnswer(poolId);
    const poolState = { ...state, wildcardAnswer };
    const entries = await listPoolEntries(poolId);
    for (const entry of entries) {
      const score = scoreEntry(entry, poolState);
      await writeEntryScore(poolId, entry.id, score);
      entriesScored++;
    }
  }

  return {
    fixturesIngested: fixtures.length,
    groupsResolved: Object.keys(state.standings).length,
    pools: poolIds.length,
    entriesScored,
    state: {
      wildcards: state.wildcards,
      advancers: state.advancers,
      lowestRankedAdvancer: state.lowestRankedAdvancer,
    },
    ranAt: state.updatedAt,
  };
}
