'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/components/UserAuth';
import {
  countEntries,
  getEntry,
  getPool,
} from '@/app/lib/wc2026/firestore-client';
import { Entry, Pool } from '@/app/lib/wc2026/types';
import Breadcrumb from '../components/Breadcrumb';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function PoolHome({ params }: { params: { poolId: string } }) {
  const { poolId } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pool, setPool] = useState<Pool | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [participants, setParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, ent, count] = await Promise.all([
        getPool(poolId),
        getEntry(poolId, user.uid),
        countEntries(poolId),
      ]);
      setPool(p);
      setEntry(ent);
      setParticipants(count);
      setLoading(false);
    })();
  }, [poolId, user]);

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-32 animate-pulse rounded-2xl bg-neutral-200" />
      </main>
    );
  }

  if (!pool) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Pool not found</h1>
          <p className="mt-2 text-sm text-neutral-600">This pool may have been deleted.</p>
          <Button className="mt-4" onClick={() => router.push('/predict-this/wc2026')}>
            Back to start
          </Button>
        </Card>
      </main>
    );
  }

  const locked = entry?.locked;
  const lockAtPassed = new Date() >= new Date(pool.lockAt);

  const copyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <>
      <Breadcrumb items={[
        { label: 'Predict This', href: '/predict-this' },
        { label: 'WC 2026', href: '/predict-this/wc2026' },
        { label: pool.name },
      ]} />
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <header className="py-6">
          <h1 className="text-3xl font-bold tracking-tight">{pool.name}</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {participants} {participants === 1 ? 'participant' : 'participants'} ·
            Locks {new Date(pool.lockAt).toLocaleString()}
          </p>
        </header>

        <Card className="p-6">
          {locked || lockAtPassed ? (
            <>
              <h2 className="text-xl font-semibold">
                {locked ? 'Your bracket is locked' : 'Submission window closed'}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {locked
                  ? 'Watch the leaderboard for updates as matches finish.'
                  : 'You did not submit a bracket before kickoff.'}
              </p>
              <Link href={`/predict-this/wc2026/${poolId}/leaderboard`} className="block mt-4">
                <Button fullWidth>View leaderboard</Button>
              </Link>
              {entry && (
                <Link
                  href={`/predict-this/wc2026/${poolId}/entry/${entry.id}`}
                  className="mt-2 block"
                >
                  <Button fullWidth variant="secondary">View your bracket</Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">
                {entry ? 'Continue your bracket' : 'Submit your bracket'}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Three quick phases: rank the 12 groups, draw the bracket, lock in props.
              </p>
              <Link
                href={`/predict-this/wc2026/${poolId}/submit`}
                className="mt-4 block"
              >
                <Button fullWidth>
                  {entry?.phaseProgress && entry.phaseProgress !== 'groups'
                    ? `Resume from ${entry.phaseProgress}`
                    : 'Start'}
                </Button>
              </Link>
              <Link href={`/predict-this/wc2026/${poolId}/leaderboard`} className="mt-2 block">
                <Button fullWidth variant="secondary">View leaderboard</Button>
              </Link>
            </>
          )}
        </Card>

        <Card className="mt-4 p-6">
          <h3 className="text-base font-semibold">Invite players</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Anyone with the link can submit a bracket before kickoff.
          </p>
          <Button
            variant="secondary"
            fullWidth
            className="mt-3"
            onClick={copyLink}
          >
            {copied ? 'Copied!' : 'Copy invite link'}
          </Button>
        </Card>
      </main>
    </>
  );
}
