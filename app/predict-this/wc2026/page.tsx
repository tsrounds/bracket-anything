'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/UserAuth';
import { createPool } from '@/app/lib/wc2026/firestore-client';
import Breadcrumb from './components/Breadcrumb';
import { Button } from './components/Button';
import { Card } from './components/Card';

export default function Wc2026Landing() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <Inner />
    </Suspense>
  );
}

function LoadingShell() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="h-32 animate-pulse rounded-2xl bg-neutral-200" />
    </main>
  );
}

function Inner() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [name, setName] = useState('');
  const [wildcardQ, setWildcardQ] = useState('Will Messi score in the World Cup?');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { setError('Pool name required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const poolId = await createPool({
        name: name.trim(),
        createdBy: user.uid,
        wildcardQuestion: wildcardQ.trim() || 'Host-defined question',
      });
      router.push(`/predict-this/wc2026/${poolId}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create pool');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Breadcrumb items={[
        { label: 'Predict This', href: '/predict-this' },
        { label: 'WC 2026' },
      ]} />
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <header className="py-6">
          <h1 className="text-4xl font-bold tracking-tight">World Cup 2026</h1>
          <p className="mt-2 text-neutral-600">
            Rank the groups, draw your bracket, lock in props. Locks at kickoff on June 11.
          </p>
        </header>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Start a pool</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Create a pool and share the link with friends.
          </p>
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Pool name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Group of Death"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                maxLength={60}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">
                Pool wildcard prop question
              </span>
              <input
                type="text"
                value={wildcardQ}
                onChange={(e) => setWildcardQ(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                maxLength={120}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Worth 10 pts. You can change this later as the pool host.
              </span>
            </label>

            {error && (
              <p className="text-sm text-accent-600">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading || submitting || !user}
            >
              {submitting ? 'Creating…' : 'Create pool'}
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
