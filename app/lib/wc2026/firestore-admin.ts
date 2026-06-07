// Server-side Firestore writes for the WC 2026 cron pipeline.
// Uses firebase-admin. Never import this file from client components.

import { adminDb } from '../firebase/firebase-admin';
import { wc2026Paths } from './firestore-paths';
import {
  Entry,
  GroupId,
  Match,
  ScoreBreakdown,
  Standing,
  TournamentState,
} from './types';

export async function listMatches(): Promise<Match[]> {
  const snap = await adminDb.collection(wc2026Paths.matchesCol).get();
  return snap.docs.map((d) => d.data() as Match);
}

export async function upsertMatch(match: Match) {
  await adminDb.doc(wc2026Paths.matchDoc(match.id)).set(match, { merge: true });
}

export async function writeStandings(standings: Partial<Record<GroupId, Standing>>) {
  const batch = adminDb.batch();
  for (const [gid, standing] of Object.entries(standings)) {
    if (!standing) continue;
    batch.set(adminDb.doc(wc2026Paths.standingDoc(gid)), standing);
  }
  await batch.commit();
}

export async function writeTournamentState(state: TournamentState) {
  await adminDb.doc(wc2026Paths.stateDoc).set(state);
}

export async function getGroupsAdmin(): Promise<Partial<Record<GroupId, string[]>>> {
  const snap = await adminDb.doc(wc2026Paths.tournamentDoc).get();
  if (!snap.exists) return {};
  const data = snap.data() as { groups?: Partial<Record<GroupId, string[]>> } | undefined;
  return data?.groups ?? {};
}

export async function listPoolIds(): Promise<string[]> {
  const snap = await adminDb.collection(wc2026Paths.poolsCol).get();
  return snap.docs.map((d) => d.id);
}

export async function listPoolEntries(poolId: string): Promise<Entry[]> {
  const snap = await adminDb.collection(wc2026Paths.entriesCol(poolId)).get();
  return snap.docs.map((d) => d.data() as Entry);
}

export async function getPoolWildcardAnswer(poolId: string): Promise<string | null> {
  const snap = await adminDb.doc(wc2026Paths.poolDoc(poolId)).get();
  const data = snap.data() as any;
  return data?.propsConfig?.wildcardAnswer ?? null;
}

export async function writeEntryScore(
  poolId: string,
  entryId: string,
  score: ScoreBreakdown,
) {
  await adminDb.doc(wc2026Paths.entryDoc(poolId, entryId)).set(
    {
      score,
      lastScoredAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function seedTournamentGroups(groups: Partial<Record<GroupId, string[]>>) {
  await adminDb.doc(wc2026Paths.tournamentDoc).set({ groups }, { merge: true });
}
