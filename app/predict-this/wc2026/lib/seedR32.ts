// Pure helper that seeds a user's 32-slot R32 from their group ranks +
// starred wildcards. No two same-group teams can meet in R32: winners are
// paired with the runner-up from the group "opposite" theirs (offset by 6),
// and the 8 wildcards fill the remaining 4 matchups against each other.
//
// This is a sensible default — the FIFA-published 48-team R32 template may
// place wildcards into specific slots against group winners, but the
// scoring engine is advancement-based so the visual pairing only affects
// the UX, not the points.

import { GROUP_IDS, GroupId, Entry } from '../../../lib/wc2026/types';

const GROUP_COUNT = 12;
const RUNNER_OFFSET = 6; // pair 1A↔2G, 1B↔2H, …

export function seedR32(
  groupRanks: Entry['groupRanks'],
  wildcards: string[],
): string[] {
  const winners: string[] = [];
  const runners: string[] = [];
  for (const gid of GROUP_IDS) {
    const r = groupRanks[gid] ?? [];
    winners.push(r[0] ?? '');
    runners.push(r[1] ?? '');
  }

  const slots: string[] = new Array(32).fill('');

  // Matchups 0–11 (slots 0–23): winner vs runner-up from a different group.
  for (let i = 0; i < GROUP_COUNT; i++) {
    slots[i * 2]     = winners[i];
    slots[i * 2 + 1] = runners[(i + RUNNER_OFFSET) % GROUP_COUNT];
  }

  // Matchups 12–15 (slots 24–31): pair the 8 wildcards.
  const wc = wildcards.slice(0, 8);
  for (let i = 0; i < 8; i++) {
    slots[24 + i] = wc[i] ?? '';
  }

  return slots;
}

// For UI labels — return the group letter a team belongs to, given the seed.
export function groupOf(
  team: string,
  groupRanks: Entry['groupRanks'],
): GroupId | null {
  for (const gid of GROUP_IDS) {
    if ((groupRanks[gid] ?? []).includes(team)) return gid;
  }
  return null;
}
