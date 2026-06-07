'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/components/UserAuth';
import {
  getGroups,
  getOrCreateEntry,
  getPool,
  lockEntry,
  saveEntryPartial,
} from '@/app/lib/wc2026/firestore-client';
import {
  GROUP_IDS,
  GroupId,
  Entry,
  Pool,
  Team,
  WILDCARD_CAP,
} from '@/app/lib/wc2026/types';
import { GROUP_SEED, TEAM_FALLBACK } from '@/app/lib/wc2026/constants';
import Breadcrumb from '../../components/Breadcrumb';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import GroupRanker from '../../components/GroupRanker';
import KnockoutBracket, { BracketState } from '../../components/KnockoutBracket';
import PropsCards from '../../components/PropsCards';
import { useAvatarName } from '../../hooks/useAvatarName';

type Phase = 'name' | 'groups' | 'knockout' | 'props' | 'review';

export default function SubmitPage({ params }: { params: { poolId: string } }) {
  const { poolId } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, setProfile, hydrated } = useAvatarName();

  const [pool, setPool] = useState<Pool | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [groups, setGroups] = useState<Partial<Record<GroupId, string[]>>>(GROUP_SEED);
  const [phase, setPhase] = useState<Phase>('name');
  const [loading, setLoading] = useState(true);

  // Bootstrap.
  useEffect(() => {
    if (!user || !hydrated) return;
    (async () => {
      const p = await getPool(poolId);
      setPool(p);
      if (!p) { setLoading(false); return; }

      // Lock-out: route closed after lockAt.
      if (new Date() >= new Date(p.lockAt)) {
        router.replace(`/predict-this/wc2026/${poolId}/leaderboard`);
        return;
      }

      const fetchedGroups = await getGroups();
      if (Object.keys(fetchedGroups).length === GROUP_IDS.length) {
        setGroups(fetchedGroups);
      }

      if (profile) {
        const e = await getOrCreateEntry(poolId, {
          uid: user.uid, name: profile.name, avatar: profile.avatar,
        });
        if (e.locked) {
          router.replace(`/predict-this/wc2026/${poolId}/leaderboard`);
          return;
        }
        setEntry(e);
        // Resume at last incomplete phase.
        const resume: Record<Entry['phaseProgress'], Phase> = {
          groups: 'groups',
          knockout: 'knockout',
          props: 'props',
          review: 'review',
          locked: 'review',
        };
        setPhase(resume[e.phaseProgress] ?? 'groups');
      }
      setLoading(false);
    })();
  }, [poolId, user, hydrated, profile, router]);

  if (authLoading || loading || !hydrated || !pool) {
    return <Shell><div className="h-32 animate-pulse rounded-2xl bg-neutral-200" /></Shell>;
  }

  if (!profile) {
    return (
      <Shell pool={pool} poolId={poolId} phase="name">
        <NameAvatarStep onSave={setProfile} />
      </Shell>
    );
  }

  if (!entry) {
    return <Shell><div className="h-32 animate-pulse rounded-2xl bg-neutral-200" /></Shell>;
  }

  return (
    <Shell pool={pool} poolId={poolId} phase={phase}>
      <Inner
        poolId={poolId}
        pool={pool}
        entry={entry}
        groups={groups}
        phase={phase}
        setPhase={setPhase}
        setEntry={setEntry}
      />
    </Shell>
  );
}

function Shell({
  children, pool, poolId, phase,
}: { children: React.ReactNode; pool?: Pool; poolId?: string; phase?: Phase }) {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Predict This', href: '/predict-this' },
        { label: 'WC 2026', href: '/predict-this/wc2026' },
        ...(pool && poolId
          ? [{ label: pool.name, href: `/predict-this/wc2026/${poolId}` }]
          : []),
        { label: 'Submit' },
      ]} />
      <main className="mx-auto max-w-2xl px-4 pb-32">{children}</main>
    </>
  );
}

function NameAvatarStep({ onSave }: { onSave: (p: { name: string; avatar: string | null }) => void }) {
  const [name, setName] = useState('');
  return (
    <Card className="mt-6 p-6">
      <h2 className="text-xl font-semibold">Who are you?</h2>
      <p className="mt-1 text-sm text-neutral-500">Shown on the leaderboard.</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="mt-4 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        maxLength={40}
      />
      <Button
        fullWidth
        className="mt-4"
        disabled={!name.trim()}
        onClick={() => onSave({ name: name.trim(), avatar: null })}
      >
        Continue
      </Button>
    </Card>
  );
}

// ---- The wizard ---------------------------------------------------------

function Inner({
  poolId, pool, entry, groups, phase, setPhase, setEntry,
}: {
  poolId: string;
  pool: Pool;
  entry: Entry;
  groups: Partial<Record<GroupId, string[]>>;
  phase: Phase;
  setPhase: (p: Phase) => void;
  setEntry: (e: Entry) => void;
}) {
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

  const persist = useCallback(
    (patch: Partial<Entry>, nextPhase?: Entry['phaseProgress']) => {
      const merged = { ...entry, ...patch, ...(nextPhase ? { phaseProgress: nextPhase } : {}) };
      setEntry(merged);
      void saveEntryPartial(poolId, entry.id, {
        ...patch,
        ...(nextPhase ? { phaseProgress: nextPhase } : {}),
      });
    },
    [entry, poolId, setEntry],
  );

  if (phase === 'groups') {
    return (
      <GroupsPhase
        groups={groups}
        teams={teams}
        entry={entry}
        onSave={(groupRanks, wildcards) => persist({ groupRanks, wildcards })}
        onComplete={(groupRanks, wildcards) => {
          persist({ groupRanks, wildcards }, 'knockout');
          setPhase('knockout');
        }}
      />
    );
  }

  if (phase === 'knockout') {
    return (
      <KnockoutPhase
        groups={groups}
        teams={teams}
        entry={entry}
        onBack={() => setPhase('groups')}
        onComplete={(knockoutPicks) => {
          persist({ knockoutPicks }, 'props');
          setPhase('props');
        }}
      />
    );
  }

  if (phase === 'props') {
    return (
      <PropsPhase
        entry={entry}
        pool={pool}
        teams={teams}
        groups={groups}
        onBack={() => setPhase('knockout')}
        onComplete={(props) => {
          persist({ props }, 'review');
          setPhase('review');
        }}
      />
    );
  }

  // review
  return (
    <ReviewPhase
      entry={entry}
      pool={pool}
      teams={teams}
      onEditGroups={() => setPhase('groups')}
      onEditKnockout={() => setPhase('knockout')}
      onEditProps={() => setPhase('props')}
      onLock={async () => {
        await lockEntry(poolId, entry.id);
        setEntry({ ...entry, locked: true, phaseProgress: 'locked' });
      }}
    />
  );
}

// ---- Phase 1 ------------------------------------------------------------

function GroupsPhase({
  groups, teams, entry, onSave, onComplete,
}: {
  groups: Partial<Record<GroupId, string[]>>;
  teams: Record<string, Team>;
  entry: Entry;
  onSave: (groupRanks: Entry['groupRanks'], wildcards: string[]) => void;
  onComplete: (groupRanks: Entry['groupRanks'], wildcards: string[]) => void;
}) {
  const [groupIdx, setGroupIdx] = useState(0);
  const [ranks, setRanks] = useState<Entry['groupRanks']>(() => {
    const init: Entry['groupRanks'] = {};
    for (const gid of GROUP_IDS) init[gid] = entry.groupRanks[gid] ?? groups[gid] ?? [];
    return init;
  });
  const [wildcards, setWildcards] = useState<string[]>(entry.wildcards ?? []);

  const gid = GROUP_IDS[groupIdx];
  const ranking = ranks[gid] ?? [];

  const currentStar = wildcards.find((w) => ranking.includes(w) && ranking.indexOf(w) === 2);

  const allGroupsComplete = GROUP_IDS.every(
    (g) => (ranks[g]?.length ?? 0) === 4,
  );

  const advance = () => {
    onSave(ranks, wildcards);
    if (groupIdx < GROUP_IDS.length - 1) {
      setGroupIdx(groupIdx + 1);
    } else if (allGroupsComplete) {
      onComplete(ranks, wildcards);
    }
  };

  return (
    <>
      <header className="py-6">
        <h1 className="text-2xl font-bold">Group {gid}</h1>
        <p className="text-sm text-neutral-500">
          Group {groupIdx + 1} of {GROUP_IDS.length}
        </p>
      </header>

      {/* Dot indicator */}
      <div className="mb-4 flex gap-1">
        {GROUP_IDS.map((g, i) => {
          const done = (ranks[g]?.length ?? 0) === 4;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setGroupIdx(i)}
              aria-label={`Group ${g}`}
              className={`h-1.5 flex-1 rounded-full transition ${
                i === groupIdx
                  ? 'bg-primary-600'
                  : done
                  ? 'bg-primary-300'
                  : 'bg-neutral-200'
              }`}
            />
          );
        })}
      </div>

      <GroupRanker
        ranking={ranking}
        teams={teams}
        starredTeam={currentStar ?? null}
        totalStarred={wildcards.length}
        onChangeRanking={(next) => {
          setRanks((p) => ({ ...p, [gid]: next }));
          // If we starred this group's 3rd-place team, keep it in sync with new 3rd
          if (currentStar) {
            const old = currentStar;
            const newThird = next[2];
            setWildcards((wc) =>
              wc.map((w) => (w === old ? newThird : w))
                .filter((v, i, arr) => arr.indexOf(v) === i),
            );
          }
        }}
        onToggleStar={(teamCode) => {
          setWildcards((wc) => {
            if (teamCode == null) {
              // unstar this group's current pick
              return wc.filter((w) => !ranking.includes(w) || ranking.indexOf(w) !== 2);
            }
            if (wc.includes(teamCode)) return wc;
            if (wc.length >= WILDCARD_CAP) return wc;
            // unstar any existing star in this group first
            const cleaned = wc.filter((w) => !ranking.includes(w) || ranking.indexOf(w) !== 2);
            return [...cleaned, teamCode];
          });
        }}
      />

      <div className="mt-6 flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setGroupIdx(Math.max(0, groupIdx - 1))}
          disabled={groupIdx === 0}
        >
          Previous
        </Button>
        <Button
          fullWidth
          onClick={advance}
          disabled={ranking.length !== 4}
        >
          {groupIdx < GROUP_IDS.length - 1
            ? 'Next group'
            : allGroupsComplete
            ? 'Continue to bracket'
            : 'Finish all groups to continue'}
        </Button>
      </div>
    </>
  );
}

// ---- Phase 2 ------------------------------------------------------------

function KnockoutPhase({
  groups, teams, entry, onBack, onComplete,
}: {
  groups: Partial<Record<GroupId, string[]>>;
  teams: Record<string, Team>;
  entry: Entry;
  onBack: () => void;
  onComplete: (kp: Entry['knockoutPicks']) => void;
}) {
  // Seed R32: 12 winners + 12 runners-up + 8 wildcards in entry.wildcards.
  const r32Initial = useMemo(() => {
    if (entry.knockoutPicks.R32.length === 32) return entry.knockoutPicks.R32;
    const winners: string[] = [];
    const runners: string[] = [];
    for (const gid of GROUP_IDS) {
      const r = entry.groupRanks[gid] ?? [];
      if (r[0]) winners.push(r[0]);
      if (r[1]) runners.push(r[1]);
    }
    const wildcards = entry.wildcards.slice(0, 8);
    // Seed simply: alternate winners + runners + wildcards into 32 slots.
    const r32: string[] = [];
    for (let i = 0; i < winners.length; i++) {
      r32.push(winners[i], runners[i] ?? '');
    }
    while (r32.length < 32 && wildcards.length) {
      r32.push(wildcards.shift()!);
    }
    while (r32.length < 32) r32.push('');
    return r32;
  }, [entry]);

  const [state, setState] = useState<BracketState>({
    R32: r32Initial,
    R16: entry.knockoutPicks.R16 ?? [],
    QF:  entry.knockoutPicks.QF ?? [],
    SF:  entry.knockoutPicks.SF ?? [],
    F:   entry.knockoutPicks.F ?? [],
    champion: entry.knockoutPicks.champion,
  });

  const ready = !!state.champion;

  return (
    <>
      <header className="py-6">
        <h1 className="text-2xl font-bold">Knockout bracket</h1>
        <p className="text-sm text-neutral-500">
          Tap a team in each matchup to advance them.
        </p>
      </header>
      <KnockoutBracket initial={state} teams={teams} onChange={setState} />

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button fullWidth disabled={!ready} onClick={() => onComplete(state)}>
          {ready ? 'Continue to props' : 'Pick a champion to continue'}
        </Button>
      </div>
    </>
  );
}

// ---- Phase 3 ------------------------------------------------------------

function PropsPhase({
  entry, pool, teams, groups, onBack, onComplete,
}: {
  entry: Entry;
  pool: Pool;
  teams: Record<string, Team>;
  groups: Partial<Record<GroupId, string[]>>;
  onBack: () => void;
  onComplete: (props: Entry['props']) => void;
}) {
  const candidates = useMemo(() => {
    const out: string[] = [];
    for (const gid of GROUP_IDS) {
      const r = entry.groupRanks[gid] ?? [];
      if (r[0]) out.push(r[0]);
      if (r[1]) out.push(r[1]);
    }
    return out;
  }, [entry]);

  const [propsState, setPropsState] = useState<Entry['props']>(entry.props);

  return (
    <>
      <header className="py-6">
        <h1 className="text-2xl font-bold">Props</h1>
        <p className="text-sm text-neutral-500">Six picks. Worth up to 95 points.</p>
      </header>
      <div className="mt-2">
        <Button variant="ghost" onClick={onBack}>← Back to bracket</Button>
      </div>
      <div className="mt-4">
        <PropsCards
          props={propsState}
          qualifierCandidates={candidates}
          teams={teams}
          wildcardQuestion={pool.propsConfig.wildcardQuestion}
          onChange={setPropsState}
          onComplete={() => onComplete(propsState)}
        />
      </div>
    </>
  );
}

// ---- Review -------------------------------------------------------------

function ReviewPhase({
  entry, pool, teams, onEditGroups, onEditKnockout, onEditProps, onLock,
}: {
  entry: Entry;
  pool: Pool;
  teams: Record<string, Team>;
  onEditGroups: () => void;
  onEditKnockout: () => void;
  onEditProps: () => void;
  onLock: () => Promise<void>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [locking, setLocking] = useState(false);

  const teamName = (c: string) => teams[c]?.name ?? c;

  if (entry.locked) {
    return (
      <Card className="mt-6 p-6">
        <h2 className="text-xl font-semibold">Bracket locked</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Watch the leaderboard for live updates.
        </p>
        <Link href={`/predict-this/wc2026/${pool.id}/leaderboard`} className="mt-4 block">
          <Button fullWidth>See leaderboard</Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      <header className="py-6">
        <h1 className="text-2xl font-bold">Review</h1>
        <p className="text-sm text-neutral-500">Lock in when you're happy.</p>
      </header>

      <Card className="mt-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Groups</h3>
          <button type="button" className="text-sm text-primary-600" onClick={onEditGroups}>
            Edit
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {GROUP_IDS.map((gid) => (
            <li key={gid} className="flex items-baseline gap-2">
              <span className="font-mono text-neutral-400">{gid}</span>
              <span className="truncate">
                {(entry.groupRanks[gid] ?? []).map(teamName).join(' › ')}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Bracket</h3>
          <button type="button" className="text-sm text-primary-600" onClick={onEditKnockout}>
            Edit
          </button>
        </div>
        <dl className="mt-3 space-y-1 text-sm">
          <RoundRow label="R16" value={entry.knockoutPicks.R16.map(teamName).join(', ')} />
          <RoundRow label="QF"  value={entry.knockoutPicks.QF.map(teamName).join(', ')} />
          <RoundRow label="SF"  value={entry.knockoutPicks.SF.map(teamName).join(', ')} />
          <RoundRow label="F"   value={entry.knockoutPicks.F.map(teamName).join(', ')} />
          <RoundRow label="Champion" value={teamName(entry.knockoutPicks.champion ?? '')} />
        </dl>
      </Card>

      <Card className="mt-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Props</h3>
          <button type="button" className="text-sm text-primary-600" onClick={onEditProps}>
            Edit
          </button>
        </div>
        <dl className="mt-3 space-y-1 text-sm">
          <RoundRow label="Golden Boot" value={entry.props.goldenBoot ?? '—'} />
          <RoundRow label="Dark horse" value={teamName(entry.props.darkHorse ?? '—')} />
          <RoundRow label="USMNT ceiling" value={entry.props.usmntCeiling ?? '—'} />
          <RoundRow label="Biggest upset" value={teamName(entry.props.biggestUpset ?? '—')} />
          <RoundRow label="Total goals" value={String(entry.props.totalGoals ?? '—')} />
          <RoundRow label="Wildcard" value={entry.props.wildcardAnswer ?? '—'} />
        </dl>
      </Card>

      <Card className="mt-4 p-5">
        {!confirming ? (
          <Button fullWidth onClick={() => setConfirming(true)}>Lock in bracket</Button>
        ) : (
          <>
            <p className="text-sm text-neutral-700">
              Once locked you can't change your picks. Continue?
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                fullWidth
                disabled={locking}
                onClick={async () => {
                  setLocking(true);
                  await onLock();
                  router.push(`/predict-this/wc2026/${pool.id}/leaderboard`);
                }}
              >
                {locking ? 'Locking…' : 'Confirm lock'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function RoundRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-24 text-neutral-500">{label}</dt>
      <dd className="flex-1 truncate">{value}</dd>
    </div>
  );
}
