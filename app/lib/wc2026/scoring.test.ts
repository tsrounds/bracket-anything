import { describe, expect, it } from 'vitest';
import { scoreEntry } from './scoring';
import {
  Entry,
  GROUP_IDS,
  Standing,
  TournamentState,
} from './types';

// ---- helpers -----------------------------------------------------------

const baseEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 'e1',
  userId: 'u1',
  name: 'Tester',
  avatar: null,
  submittedAt: null,
  locked: false,
  phaseProgress: 'review',
  groupRanks: {},
  wildcards: [],
  knockoutPicks: {
    R32: [], R16: [], QF: [], SF: [], F: [], champion: null,
  },
  props: {
    goldenBoot: null, darkHorse: null, usmntCeiling: null,
    biggestUpset: null, totalGoals: null, wildcardAnswer: null,
  },
  ...overrides,
});

const emptyState = (): TournamentState => ({
  standings: {},
  wildcards: [],
  lowestRankedAdvancer: null,
  advancers: { R32: [], R16: [], QF: [], SF: [], F: [], champion: null },
  goldenBoot: null,
  totalGoals: null,
  darkHorseProgress: null,
  updatedAt: '2026-06-12T00:00:00Z',
});

const standing = (gid: any, ranking: string[]): Standing => ({
  groupId: gid,
  ranking,
  qualified: [ranking[0], ranking[1]],
  third: ranking[2] ?? null,
});

// =================== Group stage ===================
describe('group stage scoring', () => {
  it('awards 3pt for correct 1st place and 2pt for correct 2nd place', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'CAN', 'JAM']);

    const entry = baseEntry({
      groupRanks: { A: ['USA', 'MEX', 'CAN', 'JAM'] },
    });
    const breakdown = scoreEntry(entry, state);
    expect(breakdown.groupStage).toBe(5);
  });

  it('per-slot consolation: qualifier in slot 1 but wrong order = 1pt for that slot', () => {
    // Actual finish: USA 1st, MEX 2nd.
    // User picked MEX 1st, USA 2nd. Both teams qualified but order swapped.
    // → slot 1: MEX qualified but not in correct position → 1pt
    // → slot 2: USA qualified but not in correct position → 1pt
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'CAN', 'JAM']);
    const entry = baseEntry({
      groupRanks: { A: ['MEX', 'USA', 'CAN', 'JAM'] },
    });
    expect(scoreEntry(entry, state).groupStage).toBe(2);
  });

  it('non-qualifier in slot 1 earns 0; correct slot 2 still scores 2pt', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'CAN', 'JAM']);
    const entry = baseEntry({
      groupRanks: { A: ['CAN', 'MEX', 'USA', 'JAM'] }, // CAN didn't qualify
    });
    // slot 1: CAN didn't qualify → 0
    // slot 2: MEX exact → 2pt
    expect(scoreEntry(entry, state).groupStage).toBe(2);
  });

  it('correct 1st (3pt) + qualifier-in-slot-2 (1pt consolation) totals 4pt', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'CAN', 'JAM']);
    const entry = baseEntry({
      groupRanks: { A: ['USA', 'JAM', 'MEX', 'CAN'] },
    });
    // slot 1: USA exact → 3
    // slot 2: JAM didn't qualify → 0
    // = 3 (the qualifier-misplaced-in-slot-3-or-4 doesn't earn)
    expect(scoreEntry(entry, state).groupStage).toBe(3);
  });

  it('partial group entries (less than 4 teams) score 0 for that group', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'CAN', 'JAM']);
    const entry = baseEntry({ groupRanks: { A: ['USA'] } });
    expect(scoreEntry(entry, state).groupStage).toBe(0);
  });

  it('groups without standings yet score 0', () => {
    const state = emptyState();
    const entry = baseEntry({
      groupRanks: { A: ['USA', 'MEX', 'CAN', 'JAM'] },
    });
    expect(scoreEntry(entry, state).groupStage).toBe(0);
  });

  it('sums across multiple groups', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'CAN', 'JAM']);
    state.standings.B = standing('B', ['BRA', 'ARG', 'COL', 'CHI']);
    const entry = baseEntry({
      groupRanks: {
        A: ['USA', 'MEX', 'CAN', 'JAM'], // 5
        B: ['BRA', 'CHI', 'ARG', 'COL'], // slot1 exact 3, slot2 CHI didn't qualify 0 → 3
      },
    });
    expect(scoreEntry(entry, state).groupStage).toBe(8);
  });
});

// =================== Wildcards ===================
describe('wildcard scoring', () => {
  it('2pt per starred team that finished 3rd AND is in state.wildcards', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'IRN', 'JAM']); // IRN 3rd
    state.standings.B = standing('B', ['BRA', 'ARG', 'CHI', 'COL']); // CHI 3rd
    state.wildcards = ['IRN', 'CHI'];

    const entry = baseEntry({ wildcards: ['IRN', 'CHI', 'JAM'] });
    expect(scoreEntry(entry, state).wildcards).toBe(4);
  });

  it('starred team that finished 1st or 2nd earns NO wildcard credit', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'IRN', 'JAM']);
    state.wildcards = ['USA']; // contrived: USA also in wildcards list (shouldn't happen, but defensive)
    const entry = baseEntry({ wildcards: ['USA'] });
    expect(scoreEntry(entry, state).wildcards).toBe(0);
  });

  it('starred 3rd-place team that did NOT advance as a wildcard earns 0', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'IRN', 'JAM']);
    state.wildcards = []; // IRN didn't make the cut
    const entry = baseEntry({ wildcards: ['IRN'] });
    expect(scoreEntry(entry, state).wildcards).toBe(0);
  });
});

// =================== Knockout ===================
describe('knockout scoring (advancement-based)', () => {
  it('R32: 2pt per team in user slot list that actually reached R32', () => {
    const state = emptyState();
    state.advancers.R32 = ['USA', 'MEX', 'BRA', 'ARG'];
    const entry = baseEntry({
      knockoutPicks: {
        R32: ['USA', 'CAN', 'BRA', 'JAM'], R16: [], QF: [], SF: [], F: [], champion: null,
      },
    });
    expect(scoreEntry(entry, state).R32).toBe(4); // USA + BRA
  });

  it('Each round uses its own point value', () => {
    const state = emptyState();
    state.advancers.R16 = ['USA'];
    state.advancers.QF  = ['USA'];
    state.advancers.SF  = ['USA'];
    state.advancers.F   = ['USA'];

    const entry = baseEntry({
      knockoutPicks: {
        R32: [], R16: ['USA'], QF: ['USA'], SF: ['USA'], F: ['USA'], champion: null,
      },
    });
    const b = scoreEntry(entry, state);
    expect(b.R16).toBe(4);
    expect(b.QF).toBe(8);
    expect(b.SF).toBe(16);
    expect(b.F).toBe(24);
  });

  it('duplicates in picks are de-duped (defensive)', () => {
    const state = emptyState();
    state.advancers.QF = ['USA'];
    const entry = baseEntry({
      knockoutPicks: {
        R32: [], R16: [], QF: ['USA', 'USA'], SF: [], F: [], champion: null,
      },
    });
    expect(scoreEntry(entry, state).QF).toBe(8);
  });

  it('champion bonus stacks on top of finalist credit (24 + 40 = 64)', () => {
    const state = emptyState();
    state.advancers.F = ['USA', 'BRA'];
    state.advancers.champion = 'USA';

    const entry = baseEntry({
      knockoutPicks: {
        R32: [], R16: [], QF: [], SF: [], F: ['USA', 'BRA'], champion: 'USA',
      },
    });
    const b = scoreEntry(entry, state);
    expect(b.F).toBe(48);           // both finalists right
    expect(b.championBonus).toBe(40);
    // Both finalists right + correct champion = 24*2 + 40 = 88
    expect(b.F + b.championBonus).toBe(88);
  });

  it('wrong champion = no bonus even if team is in F slot', () => {
    const state = emptyState();
    state.advancers.F = ['USA', 'BRA'];
    state.advancers.champion = 'BRA';
    const entry = baseEntry({
      knockoutPicks: {
        R32: [], R16: [], QF: [], SF: [], F: ['USA', 'BRA'], champion: 'USA',
      },
    });
    const b = scoreEntry(entry, state);
    expect(b.championBonus).toBe(0);
    expect(b.F).toBe(48); // both finalists still credit
  });
});

// =================== Props ===================
describe('props scoring', () => {
  it('Golden Boot exact match = 25pt', () => {
    const state = emptyState();
    state.goldenBoot = 'mbappe';
    const entry = baseEntry({ props: { ...baseEntry().props, goldenBoot: 'mbappe' } });
    expect(scoreEntry(entry, state).props).toBe(25);
  });

  it('Dark horse tier: R16=10, QF=15, SF=20, F=25', () => {
    for (const [round, pts] of [['R16', 10], ['QF', 15], ['SF', 20], ['F', 25]] as const) {
      const state = emptyState();
      (state.advancers as any)[round] = ['DKH'];
      const entry = baseEntry({ props: { ...baseEntry().props, darkHorse: 'DKH' } });
      expect(scoreEntry(entry, state).props).toBe(pts);
    }
  });

  it('Dark horse caps at 25 even if team wins it all', () => {
    const state = emptyState();
    state.advancers.F = ['DKH'];
    state.advancers.champion = 'DKH';
    const entry = baseEntry({ props: { ...baseEntry().props, darkHorse: 'DKH' } });
    expect(scoreEntry(entry, state).props).toBe(25);
  });

  it('Dark horse that only made R32 earns 0', () => {
    const state = emptyState();
    state.advancers.R32 = ['DKH'];
    const entry = baseEntry({ props: { ...baseEntry().props, darkHorse: 'DKH' } });
    expect(scoreEntry(entry, state).props).toBe(0);
  });

  it('USMNT ceiling exact = 15, off-by-one = 7, further = 0', () => {
    // Fill all 12 group standings so the "USA didn't advance" path resolves.
    const stateGroups = emptyState();
    for (const gid of GROUP_IDS) {
      stateGroups.standings[gid] = standing(gid, ['X','Y','Z','W']);
    }

    // USA actual = R16
    const state = emptyState();
    state.advancers.R32 = ['USA'];
    state.advancers.R16 = ['USA'];
    for (const gid of GROUP_IDS) state.standings[gid] = standing(gid, ['X','Y','Z','W']);

    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, usmntCeiling: 'R16' } }), state).props).toBe(15);
    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, usmntCeiling: 'QF'  } }), state).props).toBe(7);
    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, usmntCeiling: 'R32' } }), state).props).toBe(7);
    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, usmntCeiling: 'SF'  } }), state).props).toBe(0);
  });

  it('USMNT ceiling Champion exact = 15pt when USA wins it all', () => {
    const state = emptyState();
    state.advancers.champion = 'USA';
    state.advancers.F = ['USA','X'];
    for (const gid of GROUP_IDS) state.standings[gid] = standing(gid, ['X','Y','Z','W']);
    const entry = baseEntry({ props: { ...baseEntry().props, usmntCeiling: 'Champion' } });
    expect(scoreEntry(entry, state).props).toBe(15);
  });

  it('USMNT ceiling = Groups when USA didn\'t advance and all groups resolved', () => {
    const state = emptyState();
    for (const gid of GROUP_IDS) state.standings[gid] = standing(gid, ['X','Y','Z','W']);
    // USA absent from advancers — should resolve to "Groups"
    const exact = baseEntry({ props: { ...baseEntry().props, usmntCeiling: 'Groups' } });
    const off1  = baseEntry({ props: { ...baseEntry().props, usmntCeiling: 'R32'    } });
    expect(scoreEntry(exact, state).props).toBe(15);
    expect(scoreEntry(off1,  state).props).toBe(7);
  });

  it('Biggest upset (lowest-ranked advancer): exact match = 10', () => {
    const state = emptyState();
    state.lowestRankedAdvancer = 'JAM';
    const entry = baseEntry({ props: { ...baseEntry().props, biggestUpset: 'JAM' } });
    expect(scoreEntry(entry, state).props).toBe(10);
  });

  it('Total goals: within 5 = 10pt, within 10 = 5pt, beyond = 0', () => {
    const state = emptyState();
    state.totalGoals = 170;
    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, totalGoals: 170 } }), state).props).toBe(10);
    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, totalGoals: 174 } }), state).props).toBe(10);
    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, totalGoals: 176 } }), state).props).toBe(5);
    expect(scoreEntry(baseEntry({ props: { ...baseEntry().props, totalGoals: 181 } }), state).props).toBe(0);
  });

  it('Pool wildcard answer: case-insensitive trimmed compare scores 10pt', () => {
    const state: any = emptyState();
    state.wildcardAnswer = 'Pulisic';
    const entry = baseEntry({ props: { ...baseEntry().props, wildcardAnswer: '  pulisic  ' } });
    expect(scoreEntry(entry, state).props).toBe(10);
  });
});

// =================== Total ===================
describe('total', () => {
  it('sums all components into ScoreBreakdown.total', () => {
    const state = emptyState();
    state.standings.A = standing('A', ['USA', 'MEX', 'IRN', 'JAM']);
    state.wildcards = ['IRN'];
    state.advancers.R32 = ['USA', 'IRN'];
    state.advancers.F = ['USA', 'BRA'];
    state.advancers.champion = 'USA';
    state.goldenBoot = 'mbappe';
    state.totalGoals = 150;
    for (const gid of GROUP_IDS) {
      if (!state.standings[gid]) state.standings[gid] = standing(gid, ['X','Y','Z','W']);
    }

    const entry = baseEntry({
      groupRanks: { A: ['USA', 'MEX', 'IRN', 'JAM'] }, // 5
      wildcards: ['IRN'],                              // 2
      knockoutPicks: {
        R32: ['USA', 'IRN'],                           // 4
        R16: [], QF: [], SF: [],
        F: ['USA', 'BRA'],                             // 48
        champion: 'USA',                               // +40
      },
      props: {
        goldenBoot: 'mbappe',                          // 25
        darkHorse: null,
        usmntCeiling: 'Champion',                      // 15
        biggestUpset: null,
        totalGoals: 152,                               // 10
        wildcardAnswer: null,
      },
    });
    const b = scoreEntry(entry, state);
    expect(b.groupStage).toBe(5);
    expect(b.wildcards).toBe(2);
    expect(b.R32).toBe(4);
    expect(b.F).toBe(48);
    expect(b.championBonus).toBe(40);
    expect(b.props).toBe(50); // 25 + 15 + 10
    expect(b.total).toBe(5 + 2 + 4 + 48 + 40 + 50);
  });
});
