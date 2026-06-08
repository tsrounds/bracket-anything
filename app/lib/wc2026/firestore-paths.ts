// Centralised Firestore path strings for the WC 2026 prediction game.
// Importers should never inline these strings.

export const wc2026Paths = {
  tournamentDoc: 'tournaments/wc2026',
  stateDoc:      'tournaments/wc2026/meta/state',
  matchesCol:    'tournaments/wc2026/matches',
  matchDoc:      (matchId: string) => `tournaments/wc2026/matches/${matchId}`,
  standingsCol:  'tournaments/wc2026/standings',
  standingDoc:   (groupId: string) => `tournaments/wc2026/standings/${groupId}`,

  poolsCol:      'pools',
  poolDoc:       (poolId: string) => `pools/${poolId}`,
  entriesCol:    (poolId: string) => `pools/${poolId}/entries`,
  entryDoc:      (poolId: string, entryId: string) =>
                   `pools/${poolId}/entries/${entryId}`,
};
