'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GOLDEN_BOOT_FAVORITES,
  TOTAL_GOALS_RANGE,
} from '@/app/lib/wc2026/constants';
import {
  Entry,
  Team,
  USMNTCeiling,
  USMNT_CEILING_ORDER,
} from '@/app/lib/wc2026/types';
import { Button } from './Button';
import { Card } from './Card';

const STEPS = ['goldenBoot', 'darkHorse', 'usmntCeiling', 'biggestUpset', 'totalGoals', 'wildcardAnswer'] as const;
type Step = (typeof STEPS)[number];

interface Props {
  props: Entry['props'];
  qualifierCandidates: string[];   // 24 teams (12 winners + 12 runners-up) for darkHorse + biggestUpset
  wildcardQuestion: string;
  teams: Record<string, Team>;
  onChange: (next: Entry['props']) => void;
  onComplete: () => void;
}

export default function PropsCards({
  props,
  qualifierCandidates,
  wildcardQuestion,
  teams,
  onChange,
  onComplete,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const update = (patch: Partial<Entry['props']>) => onChange({ ...props, ...patch });

  const next = () => {
    if (stepIdx === STEPS.length - 1) onComplete();
    else setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
        <span>Prop {stepIdx + 1} of {STEPS.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.18 }}
        >
          {step === 'goldenBoot' && (
            <PlayerPicker
              value={props.goldenBoot}
              onChange={(v) => update({ goldenBoot: v })}
            />
          )}
          {step === 'darkHorse' && (
            <TeamPicker
              title="Dark horse"
              description="Pick a team ranked #20+ FIFA. Tiered points for reaching R16/QF/SF/Final."
              value={props.darkHorse}
              candidates={qualifierCandidates.filter((c) => {
                const rank = teams[c]?.fifaRank;
                return rank == null || rank >= 20;
              })}
              teams={teams}
              onChange={(v) => update({ darkHorse: v })}
            />
          )}
          {step === 'usmntCeiling' && (
            <UsmntCeiling
              value={props.usmntCeiling}
              onChange={(v) => update({ usmntCeiling: v })}
            />
          )}
          {step === 'biggestUpset' && (
            <TeamPicker
              title="Biggest upset"
              description="The lowest-FIFA-ranked team to advance out of the group stage."
              value={props.biggestUpset}
              candidates={qualifierCandidates}
              teams={teams}
              onChange={(v) => update({ biggestUpset: v })}
            />
          )}
          {step === 'totalGoals' && (
            <TotalGoals
              value={props.totalGoals}
              onChange={(v) => update({ totalGoals: v })}
            />
          )}
          {step === 'wildcardAnswer' && (
            <WildcardPrompt
              question={wildcardQuestion}
              value={props.wildcardAnswer}
              onChange={(v) => update({ wildcardAnswer: v })}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={prev} disabled={stepIdx === 0}>
          Back
        </Button>
        <Button onClick={next} fullWidth>
          {stepIdx === STEPS.length - 1 ? 'Review' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

// ---- step components ----------------------------------------------------

function PlayerPicker({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = GOLDEN_BOOT_FAVORITES.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold">Golden Boot winner</h3>
      <p className="text-sm text-neutral-500">25 pts if correct.</p>
      <input
        type="text"
        placeholder="Search players"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-4 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      <ul className="mt-3 max-h-64 overflow-y-auto space-y-1">
        {filtered.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onChange(p.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                value === p.id ? 'bg-primary-50 text-primary-900' : 'hover:bg-neutral-50'
              }`}
            >
              <span>{p.name}</span>
              <span className="text-xs text-neutral-500">{p.team}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TeamPicker({
  title, description, value, candidates, teams, onChange,
}: {
  title: string;
  description: string;
  value: string | null;
  candidates: string[];
  teams: Record<string, Team>;
  onChange: (v: string) => void;
}) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-neutral-500">{description}</p>
      <ul className="mt-4 max-h-72 overflow-y-auto space-y-1">
        {candidates.map((code) => (
          <li key={code}>
            <button
              type="button"
              onClick={() => onChange(code)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                value === code ? 'bg-primary-50 text-primary-900' : 'hover:bg-neutral-50'
              }`}
            >
              <span>{teams[code]?.name ?? code}</span>
              {teams[code]?.fifaRank != null && (
                <span className="text-xs text-neutral-500">#{teams[code]!.fifaRank}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function UsmntCeiling({
  value, onChange,
}: { value: USMNTCeiling | null; onChange: (v: USMNTCeiling) => void }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold">USMNT ceiling</h3>
      <p className="text-sm text-neutral-500">15 pts exact, 7 pts off by one round.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {USMNT_CEILING_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
              value === c
                ? 'border-primary-500 bg-primary-50 text-primary-900'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </Card>
  );
}

function TotalGoals({
  value, onChange,
}: { value: number | null; onChange: (v: number) => void }) {
  const v = value ?? 170;
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold">Total tournament goals</h3>
      <p className="text-sm text-neutral-500">10 pts within ±5, 5 pts within ±10.</p>
      <div className="mt-6 text-center">
        <div className="text-5xl font-bold tabular-nums">{v}</div>
      </div>
      <input
        type="range"
        min={TOTAL_GOALS_RANGE.min}
        max={TOTAL_GOALS_RANGE.max}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-primary-600"
      />
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{TOTAL_GOALS_RANGE.min}</span>
        <span>{TOTAL_GOALS_RANGE.max}</span>
      </div>
    </Card>
  );
}

function WildcardPrompt({
  question, value, onChange,
}: { question: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold">Pool wildcard prop</h3>
      <p className="mt-1 text-sm text-neutral-700">{question}</p>
      <p className="text-xs text-neutral-500">Host-judged. 10 pts.</p>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer"
        rows={4}
        className="mt-3 w-full rounded-xl border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </Card>
  );
}
