'use client';

// Phase 2: mobile-first knockout bracket UI.
// Round tabs at top (R32 / R16 / QF / SF / F). Tap a team to advance it.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '@/app/lib/wc2026/types';

const ROUNDS = ['R32', 'R16', 'QF', 'SF', 'F'] as const;
type Round = (typeof ROUNDS)[number];

export interface BracketState {
  R32: string[];   // 32 teams (slots 0..31 — adjacent pairs are matchups)
  R16: string[];   // 16 teams
  QF:  string[];   // 8
  SF:  string[];   // 4
  F:   string[];   // 2
  champion: string | null;
}

interface Props {
  initial: BracketState;
  teams: Record<string, Team>;
  onChange: (next: BracketState) => void;
}

export default function KnockoutBracket({ initial, teams, onChange }: Props) {
  const [state, setState] = useState<BracketState>(initial);
  const [round, setRound] = useState<Round>('R32');

  useEffect(() => { onChange(state); }, [state, onChange]);

  const update = (next: Partial<BracketState>) => setState((p) => ({ ...p, ...next }));

  // Pick a team to advance to the next round.
  const pickWinner = (currentRound: Round, matchupIndex: number, team: string) => {
    const nextRoundIdx = ROUNDS.indexOf(currentRound) + 1;
    if (currentRound === 'F') {
      update({ champion: state.champion === team ? null : team });
      return;
    }
    const nextRound = ROUNDS[nextRoundIdx];
    const nextSlots = [...state[nextRound]];
    nextSlots[matchupIndex] = team;
    // Clear deeper rounds if this changes upstream picks.
    const cleared: Partial<BracketState> = { [nextRound]: nextSlots } as any;
    for (let i = nextRoundIdx + 1; i < ROUNDS.length; i++) {
      cleared[ROUNDS[i]] = [];
    }
    if (state.champion) cleared.champion = null;
    setState((p) => ({ ...p, ...cleared } as BracketState));

    // Auto-advance tab when this round is complete.
    const newRoundSlots = (cleared[currentRound] as string[] | undefined) ?? state[currentRound];
    const expectedLen = state[currentRound].length / 2;
    if (nextSlots.filter(Boolean).length === expectedLen && nextRoundIdx < ROUNDS.length) {
      setRound(nextRound);
    }
  };

  const roundUnlocked = (r: Round): boolean => {
    const idx = ROUNDS.indexOf(r);
    if (idx === 0) return true;
    const prev = ROUNDS[idx - 1];
    return state[prev].length > 0 && state[prev].every(Boolean);
  };

  return (
    <div>
      {/* Round tabs */}
      <div className="flex gap-1 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
        {ROUNDS.map((r) => {
          const enabled = roundUnlocked(r);
          const active = r === round;
          return (
            <button
              key={r}
              type="button"
              onClick={() => enabled && setRound(r)}
              disabled={!enabled}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-primary-600 text-white'
                  : enabled
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Matchups */}
      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {pairs(state[round]).map(([a, b], i) => {
            const selectedNext =
              round === 'F' ? state.champion : state[ROUNDS[ROUNDS.indexOf(round) + 1]]?.[i];
            return (
              <MatchCard
                key={`${round}-${i}-${a}-${b}`}
                teamA={a}
                teamB={b}
                selected={selectedNext ?? null}
                teamsMeta={teams}
                onPick={(team) => pickWinner(round, i, team)}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function pairs(arr: string[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push([arr[i] ?? '', arr[i + 1] ?? '']);
  }
  return out;
}

function MatchCard({
  teamA, teamB, selected, teamsMeta, onPick,
}: {
  teamA: string;
  teamB: string;
  selected: string | null;
  teamsMeta: Record<string, Team>;
  onPick: (team: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
      <TeamRow team={teamA} meta={teamsMeta[teamA]} selected={selected === teamA} onPick={() => onPick(teamA)} />
      <div className="h-px bg-neutral-100" />
      <TeamRow team={teamB} meta={teamsMeta[teamB]} selected={selected === teamB} onPick={() => onPick(teamB)} />
    </div>
  );
}

function TeamRow({
  team, meta, selected, onPick,
}: { team: string; meta: Team | undefined; selected: boolean; onPick: () => void }) {
  if (!team) return <div className="p-4 text-sm text-neutral-400">TBD</div>;
  return (
    <button
      type="button"
      onClick={onPick}
      className={`flex w-full items-center justify-between px-4 py-3 transition ${
        selected
          ? 'bg-primary-50 text-primary-900'
          : 'hover:bg-neutral-50 active:bg-neutral-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="font-medium">{meta?.name ?? team}</div>
        {meta?.fifaRank != null && (
          <div className="text-xs text-neutral-400">#{meta.fifaRank}</div>
        )}
      </div>
      {selected && <span className="text-primary-600">✓</span>}
    </button>
  );
}
