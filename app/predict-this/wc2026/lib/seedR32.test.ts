import { describe, expect, it } from 'vitest';
import { seedR32 } from './seedR32';
import { GROUP_IDS, Entry } from '../../../lib/wc2026/types';

function fakeGroupRanks(): Entry['groupRanks'] {
  const out: Entry['groupRanks'] = {};
  GROUP_IDS.forEach((gid) => {
    out[gid] = [`1${gid}`, `2${gid}`, `3${gid}`, `4${gid}`];
  });
  return out;
}

describe('seedR32', () => {
  const wildcards = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

  it('produces exactly 32 slots, all filled', () => {
    const slots = seedR32(fakeGroupRanks(), wildcards);
    expect(slots).toHaveLength(32);
    expect(slots.every((s) => s.length > 0)).toBe(true);
  });

  it('never pairs two teams from the same group', () => {
    const ranks = fakeGroupRanks();
    const slots = seedR32(ranks, wildcards);
    for (let i = 0; i < slots.length; i += 2) {
      const a = slots[i];
      const b = slots[i + 1];
      // Group label is the second char of "1A", "2A", etc.
      const aGroup = a.length === 2 ? a[1] : null;
      const bGroup = b.length === 2 ? b[1] : null;
      if (aGroup && bGroup) {
        expect(aGroup).not.toBe(bGroup);
      }
    }
  });

  it('puts all 12 winners in the first 12 matchups (even slots 0,2,…,22)', () => {
    const slots = seedR32(fakeGroupRanks(), wildcards);
    for (const gid of GROUP_IDS) {
      const winner = `1${gid}`;
      const idx = slots.indexOf(winner);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(24);
      expect(idx % 2).toBe(0);
    }
  });

  it('places all 8 wildcards in slots 24..31', () => {
    const slots = seedR32(fakeGroupRanks(), wildcards);
    for (const wc of wildcards) {
      const idx = slots.indexOf(wc);
      expect(idx).toBeGreaterThanOrEqual(24);
      expect(idx).toBeLessThan(32);
    }
  });

  it('handles fewer than 8 wildcards by leaving trailing slots empty', () => {
    const slots = seedR32(fakeGroupRanks(), ['W1', 'W2']);
    expect(slots.slice(0, 26).every((s) => s.length > 0)).toBe(true);
    expect(slots.slice(26).every((s) => s === '')).toBe(true);
  });
});
