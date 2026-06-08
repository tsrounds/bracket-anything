'use client';

import { useEffect, useMemo, useState } from 'react';
import { getEntry, getGroups, getPool } from '@/app/lib/wc2026/firestore-client';
import { GROUP_IDS, GroupId, Entry, Pool, Team } from '@/app/lib/wc2026/types';
import { GROUP_SEED, TEAM_FALLBACK } from '@/app/lib/wc2026/constants';
import Breadcrumb from '../../../components/Breadcrumb';
import { Card } from '../../../components/Card';

export default function EntryView({
  params,
}: { params: { poolId: string; entryId: string } }) {
  const { poolId, entryId } = params;
  const [pool, setPool] = useState<Pool | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [groups, setGroups] = useState<Partial<Record<GroupId, string[]>>>(GROUP_SEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, e, g] = await Promise.all([
        getPool(poolId),
        getEntry(poolId, entryId),
        getGroups(),
      ]);
      setPool(p);
      setEntry(e);
      if (Object.keys(g).length === GROUP_IDS.length) setGroups(g);
      setLoading(false);
    })();
  }, [poolId, entryId]);

  const teams = useMemo<Record<string, Team>>(() => {
    const out: Record<string, Team> = {};
    for (const gid of GROUP_IDS) {
      for (const code of groups[gid] ?? []) {
        out[code] = {
          code,
          name: TEAM_FALLBACK[code]?.name ?? code,
          fifaRank: TEAM_FALLBACK[code]?.fifaRank ?? null,
        };
      }
    }
    return out;
  }, [groups]);

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-32 animate-pulse rounded-2xl bg-neutral-200" />
      </main>
    );
  }

  if (!entry || !pool) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-6">
          <p>Entry not found.</p>
        </Card>
      </main>
    );
  }

  const tn = (c: string) => teams[c]?.name ?? c;
  const star = (c: string) => (entry.wildcards.includes(c) ? ' ★' : '');

  return (
    <>
      <Breadcrumb items={[
        { label: 'Predict This', href: '/predict-this' },
        { label: 'WC 2026', href: '/predict-this/wc2026' },
        { label: pool.name, href: `/predict-this/wc2026/${poolId}` },
        { label: 'Leaderboard', href: `/predict-this/wc2026/${poolId}/leaderboard` },
        { label: entry.name },
      ]} />
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <header className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">{entry.name}</h1>
          {entry.score && (
            <p className="mt-1 text-sm text-neutral-500">
              {entry.score.total} pts total
            </p>
          )}
        </header>

        {entry.score && (
          <Card className="p-5">
            <h3 className="font-semibold">Score breakdown</h3>
            <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm tabular-nums">
              <Row label="Groups" v={entry.score.groupStage} />
              <Row label="Wildcards" v={entry.score.wildcards} />
              <Row label="R32" v={entry.score.R32} />
              <Row label="R16" v={entry.score.R16} />
              <Row label="QF" v={entry.score.QF} />
              <Row label="SF" v={entry.score.SF} />
              <Row label="F" v={entry.score.F} />
              <Row label="Champion" v={entry.score.championBonus} />
              <Row label="Props" v={entry.score.props} />
              <Row label="Total" v={entry.score.total} bold />
            </dl>
          </Card>
        )}

        <Card className="mt-3 p-5">
          <h3 className="font-semibold">Groups</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {GROUP_IDS.map((gid) => (
              <li key={gid}>
                <div className="font-mono text-xs text-neutral-400">Group {gid}</div>
                <div className="truncate">
                  {(entry.groupRanks[gid] ?? []).map((c, i) =>
                    `${i + 1}. ${tn(c)}${i === 2 ? star(c) : ''}`,
                  ).join(' · ')}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mt-3 p-5">
          <h3 className="font-semibold">Knockout</h3>
          <dl className="mt-3 space-y-1 text-sm">
            <Row2 label="R16" v={entry.knockoutPicks.R16.map(tn).join(', ')} />
            <Row2 label="QF"  v={entry.knockoutPicks.QF.map(tn).join(', ')} />
            <Row2 label="SF"  v={entry.knockoutPicks.SF.map(tn).join(', ')} />
            <Row2 label="F"   v={entry.knockoutPicks.F.map(tn).join(', ')} />
            <Row2 label="Champion" v={tn(entry.knockoutPicks.champion ?? '—')} />
          </dl>
        </Card>

        <Card className="mt-3 p-5">
          <h3 className="font-semibold">Props</h3>
          <dl className="mt-3 space-y-1 text-sm">
            <Row2 label="Golden Boot" v={entry.props.goldenBoot ?? '—'} />
            <Row2 label="Dark horse" v={tn(entry.props.darkHorse ?? '—')} />
            <Row2 label="USMNT ceiling" v={entry.props.usmntCeiling ?? '—'} />
            <Row2 label="Biggest upset" v={tn(entry.props.biggestUpset ?? '—')} />
            <Row2 label="Total goals" v={String(entry.props.totalGoals ?? '—')} />
            <Row2 label="Wildcard" v={entry.props.wildcardAnswer ?? '—'} />
          </dl>
        </Card>
      </main>
    </>
  );
}

function Row({ label, v, bold }: { label: string; v: number; bold?: boolean }) {
  return (
    <>
      <dt className={`text-neutral-500 ${bold ? 'font-semibold text-neutral-900' : ''}`}>
        {label}
      </dt>
      <dd className={`text-right ${bold ? 'font-bold' : ''}`}>{v}</dd>
    </>
  );
}

function Row2({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-32 text-neutral-500">{label}</dt>
      <dd className="flex-1 truncate">{v}</dd>
    </div>
  );
}
