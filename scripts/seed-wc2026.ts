// One-shot seed script for the WC 2026 prediction game.
// Writes the 12 groups (placeholder team codes until the Dec 2025 draw is filled in)
// to Firestore at tournaments/wc2026.
//
// Usage:
//   npx ts-node scripts/seed-wc2026.ts

import { GROUP_SEED } from '../app/lib/wc2026/constants';
import { seedTournamentGroups } from '../app/lib/wc2026/firestore-admin';

async function main() {
  console.log('Seeding WC 2026 groups…');
  await seedTournamentGroups(GROUP_SEED);
  console.log('Done. Replace placeholder codes in constants.ts with the real Dec 2025 draw before launch.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
