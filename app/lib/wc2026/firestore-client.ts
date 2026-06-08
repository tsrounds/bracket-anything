// Typed Firestore reads/writes for the WC 2026 prediction game.
// Client-side only. Uses the existing app/lib/firebase/firebase-client.ts.

'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase/firebase-client';
import { wc2026Paths } from './firestore-paths';
import {
  Entry,
  GroupId,
  LOCK_AT_DEFAULT,
  Pool,
  Standing,
  TournamentState,
} from './types';

function requireDb() {
  if (!db) throw new Error('Firestore is not initialised (server context).');
  return db as any;
}

// ---- Pools --------------------------------------------------------------

export async function createPool(input: {
  name: string;
  createdBy: string;
  wildcardQuestion?: string;
}): Promise<string> {
  const d = requireDb();
  const ref = doc(collection(d, wc2026Paths.poolsCol));
  const pool: Pool = {
    id: ref.id,
    name: input.name,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    lockAt: LOCK_AT_DEFAULT,
    propsConfig: {
      wildcardQuestion: input.wildcardQuestion ?? 'Host-defined question',
      wildcardAnswer: null,
    },
  };
  await setDoc(ref, pool);
  return ref.id;
}

export async function getPool(poolId: string): Promise<Pool | null> {
  const snap = await getDoc(doc(requireDb(), wc2026Paths.poolDoc(poolId)));
  return snap.exists() ? (snap.data() as Pool) : null;
}

export async function updatePoolWildcard(
  poolId: string,
  partial: { wildcardQuestion?: string; wildcardAnswer?: string | null },
) {
  await updateDoc(doc(requireDb(), wc2026Paths.poolDoc(poolId)), {
    'propsConfig.wildcardQuestion': partial.wildcardQuestion,
    'propsConfig.wildcardAnswer':   partial.wildcardAnswer,
  } as any);
}

// ---- Entries ------------------------------------------------------------

export async function getOrCreateEntry(
  poolId: string,
  user: { uid: string; name: string; avatar: string | null },
): Promise<Entry> {
  const d = requireDb();
  const ref = doc(d, wc2026Paths.entryDoc(poolId, user.uid));
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as Entry;

  const entry: Entry = {
    id: user.uid,
    userId: user.uid,
    name: user.name,
    avatar: user.avatar,
    submittedAt: null,
    locked: false,
    phaseProgress: 'groups',
    groupRanks: {},
    wildcards: [],
    knockoutPicks: { R32: [], R16: [], QF: [], SF: [], F: [], champion: null },
    props: {
      goldenBoot: null, darkHorse: null, usmntCeiling: null,
      biggestUpset: null, totalGoals: null, wildcardAnswer: null,
    },
    // Initialise with a zeroed breakdown so the leaderboard's
    // orderBy('score.total') query includes this entry before the cron runs.
    score: {
      groupStage: 0, wildcards: 0,
      R32: 0, R16: 0, QF: 0, SF: 0, F: 0,
      championBonus: 0, props: 0, total: 0,
    },
  };
  await setDoc(ref, entry);
  return entry;
}

export async function saveEntryPartial(
  poolId: string,
  entryId: string,
  partial: Partial<Entry>,
) {
  await setDoc(
    doc(requireDb(), wc2026Paths.entryDoc(poolId, entryId)),
    partial,
    { merge: true },
  );
}

export async function lockEntry(poolId: string, entryId: string) {
  await updateDoc(doc(requireDb(), wc2026Paths.entryDoc(poolId, entryId)), {
    locked: true,
    phaseProgress: 'locked',
    submittedAt: new Date().toISOString(),
  } as any);
}

export async function getEntry(poolId: string, entryId: string): Promise<Entry | null> {
  const snap = await getDoc(doc(requireDb(), wc2026Paths.entryDoc(poolId, entryId)));
  return snap.exists() ? (snap.data() as Entry) : null;
}

export async function countEntries(poolId: string): Promise<number> {
  const snaps = await getDocs(collection(requireDb(), wc2026Paths.entriesCol(poolId)));
  return snaps.size;
}

// Realtime leaderboard listener.
export function subscribeLeaderboard(
  poolId: string,
  cb: (entries: Entry[]) => void,
): () => void {
  const q = query(
    collection(requireDb(), wc2026Paths.entriesCol(poolId)),
    orderBy('score.total', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const rows: Entry[] = [];
    snap.forEach((d) => rows.push(d.data() as Entry));
    cb(rows);
  });
}

// ---- Tournament reads ---------------------------------------------------

export async function getTournamentState(): Promise<TournamentState | null> {
  const snap = await getDoc(doc(requireDb(), wc2026Paths.stateDoc));
  return snap.exists() ? (snap.data() as TournamentState) : null;
}

export function subscribeTournamentState(cb: (s: TournamentState | null) => void) {
  return onSnapshot(doc(requireDb(), wc2026Paths.stateDoc), (snap) => {
    cb(snap.exists() ? (snap.data() as TournamentState) : null);
  });
}

export async function getGroups(): Promise<Partial<Record<GroupId, string[]>>> {
  const snap = await getDoc(doc(requireDb(), wc2026Paths.tournamentDoc));
  if (!snap.exists()) return {};
  const data = snap.data() as { groups?: Partial<Record<GroupId, string[]>> };
  return data.groups ?? {};
}

export async function getStandings(): Promise<Partial<Record<GroupId, Standing>>> {
  const snaps = await getDocs(collection(requireDb(), wc2026Paths.standingsCol));
  const out: Partial<Record<GroupId, Standing>> = {};
  snaps.forEach((d) => {
    const s = d.data() as Standing;
    out[s.groupId] = s;
  });
  return out;
}
