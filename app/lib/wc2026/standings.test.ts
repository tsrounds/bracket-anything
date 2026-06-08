import { describe, expect, it } from 'vitest';
import {
  computeAdvancers,
  computeGroupStanding,
  computeLowestRankedAdvancer,
  computeWildcards,
} from './standings';
import { Match } from './types';

const m = (
  group: any,
  round: Match['round'],
  teamA: string,
  scoreA: number,
  teamB: string,
  scoreB: number,
  status: Match['status'] = 'final',
): Match => ({
  id: `${teamA}-${teamB}`,
  round,
  date: '2026-06-15',
  teamA, teamB, scoreA, scoreB,
  status,
  winner: scoreA > scoreB ? teamA : scoreB > scoreA ? teamB : null,
  group,
});

describe('computeGroupStanding', () => {
  it('ranks by points, then GD, then GF', () => {
    const teams = ['USA', 'MEX', 'CAN', 'JAM'];
    const matches = [
      m('A', 'group', 'USA', 3, 'JAM', 0),
      m('A', 'group', 'MEX', 1, 'CAN', 0),
      m('A', 'group', 'USA', 1, 'MEX', 1),
      m('A', 'group', 'CAN', 0, 'JAM', 0),
      m('A', 'group', 'USA', 2, 'CAN', 1),
      m('A', 'group', 'MEX', 2, 'JAM', 1),
    ];
    const s = computeGroupStanding('A', teams, matches);
    expect(s.ranking[0]).toBe('USA');   // 7pts, GD+5
    expect(s.ranking[1]).toBe('MEX');   // 7pts, GD+2
    expect(s.qualified).toEqual(['USA', 'MEX']);
    expect(s.third).toBe('CAN');
  });

  it('ignores non-final matches', () => {
    const matches = [
      m('A', 'group', 'USA', 5, 'MEX', 0, 'scheduled'),
    ];
    const s = computeGroupStanding('A', ['USA','MEX','CAN','JAM'], matches);
    expect(s.ranking).toHaveLength(4);
    // No matches counted => all 0pts, tiebreak alphabetical
    expect(s.ranking).toEqual(['CAN', 'JAM', 'MEX', 'USA']);
  });
});

describe('computeAdvancers', () => {
  it('collects unique teams per knockout round', () => {
    const matches = [
      m('A', 'R32', 'USA', 2, 'CAN', 1),
      m('A', 'R32', 'BRA', 3, 'ARG', 0),
      m('A', 'R16', 'USA', 1, 'BRA', 0),
      m('A', 'F',   'USA', 2, 'FRA', 1),
    ];
    const a = computeAdvancers(matches);
    expect(a.R32.sort()).toEqual(['ARG','BRA','CAN','USA']);
    expect(a.R16.sort()).toEqual(['BRA','USA']);
    expect(a.F.sort()).toEqual(['FRA','USA']);
    expect(a.champion).toBe('USA');
  });

  it('group matches are ignored', () => {
    const a = computeAdvancers([m('A','group','USA',1,'MEX',0)]);
    expect(a.R32).toEqual([]);
  });
});

describe('computeWildcards', () => {
  it('picks 8 best 3rd-place teams across groups', () => {
    // Build 12 groups each with a 3rd-place team that played one decisive match.
    const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const;
    const standings: any = {};
    const matches: Match[] = [];
    groups.forEach((g, i) => {
      const third = `T${g}`;
      standings[g] = { groupId: g, ranking: ['X','Y',third,'Z'], qualified:['X','Y'], third };
      // Give T_A the best record (3pts), then decreasing.
      const goalsFor = 12 - i;
      matches.push(m(g, 'group', third, goalsFor, 'opp', 0));
    });
    const w = computeWildcards(standings, matches);
    expect(w).toHaveLength(8);
    expect(w).toContain('TA'); // best
    expect(w).not.toContain('TL'); // worst
  });
});

describe('computeLowestRankedAdvancer', () => {
  it('returns advancer with highest FIFA rank number', () => {
    const standings: any = {
      A: { groupId: 'A', ranking: ['USA','JAM','PAN','HAI'], qualified: ['USA','JAM'] },
      B: { groupId: 'B', ranking: ['BRA','CHI','PAR','VEN'], qualified: ['BRA','CHI'] },
    };
    const ranks = { USA: 16, JAM: 65, BRA: 5, CHI: 40, IRN: 22 };
    const wildcards = ['IRN'];
    expect(computeLowestRankedAdvancer(standings, wildcards, ranks)).toBe('JAM');
  });

  it('returns null if no ranks are known for any advancer', () => {
    const standings: any = {
      A: { groupId: 'A', ranking: ['X','Y','Z','W'], qualified: ['X','Y'] },
    };
    expect(computeLowestRankedAdvancer(standings, [], {})).toBe(null);
  });
});
