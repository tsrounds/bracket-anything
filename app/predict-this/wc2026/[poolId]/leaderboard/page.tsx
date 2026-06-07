'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  getPool,
  subscribeLeaderboard,
  subscribeTournamentState,
} from '@/app/lib/wc2026/firestore-client';
import { Entry, Pool, TournamentState } from '@/app/lib/wc2026/types';
import Breadcrumb from '../../components/Breadcrumb';
import { Card } from '../../components/Card';

function lastPhaseDelta(entry: Entry): string | null {
  const s = entry.score;
  if (!s) return null;
  // Return the most-recent positive contribution.
  const order: Array<[string, number]> = [
    ['Champion', s.championBonus],
    ['Final',    s.F],
    ['SF',       s.SF],
    ['QF',       s.QF],
    ['R16',      s.R16],
    ['R32',      s.R32],
    ['Props',    s.props],
    ['Wildcards',s.wildcards],
    ['Groups',   s.groupStage],
  ];
  for (const [name, val] of order) {
    if (val > 0) return `+${val} from ${name}`;
  }
  return null;
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt="" className="h-9 w-9 rounded-full" />;
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium">
      {initial}
    </div>
  );
}

export default function LeaderboardPage({ params }: { params: { poolId: string } }) {
  const { poolId } = params;
  const [pool, setPool] = useState<Pool | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [state, setState] = useState<TournamentState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getPool(poolId).then(setPool);
    const off1 = subscribeLeaderboard(poolId, (rows) => {
      setEntries(rows);
      setReady(true);
    });
    const off2 = subscribeTournamentState(setState);
    return () => { off1(); off2(); };
  }, [poolId]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0)),
    [entries],
  );

  return (
    <>
      <Breadcrumb items={[
        { label: 'Predict This', href: '/predict-this' },
        { label: 'WC 2026', href: '/predict-this/wc2026' },
        { label: pool?.name ?? 'Pool', href: `/predict-this/wc2026/${poolId}` },
        { label: 'Leaderboard' },
      ]} />
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <header className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          {state?.updatedAt && (
            <p className="mt-1 text-xs text-neutral-500">
              Last updated {new Date(state.updatedAt).toLocaleTimeString()}
            </p>
          )}
        </header>

        {!ready ? (
          <div className="h-32 animate-pulse rounded-2xl bg-neutral-200" />
        ) : sorted.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-neutral-600">
              No entries yet. Share the pool link to get started.
            </p>
          </Card>
        ) : (
          <ol className="space-y-2">
            {sorted.map((entry, i) => {
              const delta = lastPhaseDelta(entry);
              return (
                <li key={entry.id}>
                  <Link
                    href={`/predict-this/wc2026/${poolId}/entry/${entry.id}`}
                    className="block"
                  >
                    <Card className="flex items-center gap-3 p-4 card-hover">
                      <div className="w-6 text-center text-sm font-semibold text-neutral-500">
                        {i + 1}
                      </div>
                      <Avatar name={entry.name} avatar={entry.avatar} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{entry.name}</div>
                        {delta && (
                          <div className="text-xs text-success-600">{delta}</div>
                        )}
                      </div>
                      <div className="text-xl font-bold tabular-nums">
                        {entry.score?.total ?? 0}
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
