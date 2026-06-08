// FIFA Men's World Ranking snapshot.
// Source: https://inside.fifa.com/fifa-world-ranking/men
//
// Schema: rank (lower = better), name (display), code (3-letter FIFA tri-code).
// Snapshot lives as a TS object so importers get type-checking and the build
// catches typos in tri-codes used elsewhere in app/lib/wc2026.

export interface FifaRank {
  rank: number;
  name: string;
  code: string;          // FIFA tri-code, e.g. 'USA', 'BRA'
}

export const FIFA_RANKING_AS_OF = '2026-04-03';

// Top 105 ordered by rank ascending. Covers every team realistically in
// contention for WC 2026 qualification.
export const FIFA_RANKING: FifaRank[] = [
  { rank: 1,   name: 'Argentina',            code: 'ARG' },
  { rank: 2,   name: 'Spain',                code: 'ESP' },
  { rank: 3,   name: 'France',               code: 'FRA' },
  { rank: 4,   name: 'England',              code: 'ENG' },
  { rank: 5,   name: 'Portugal',             code: 'POR' },
  { rank: 6,   name: 'Brazil',               code: 'BRA' },
  { rank: 7,   name: 'Morocco',              code: 'MAR' },
  { rank: 8,   name: 'Netherlands',          code: 'NED' },
  { rank: 9,   name: 'Belgium',              code: 'BEL' },
  { rank: 10,  name: 'Germany',              code: 'GER' },
  { rank: 11,  name: 'Croatia',              code: 'CRO' },
  { rank: 12,  name: 'Italy',                code: 'ITA' },
  { rank: 13,  name: 'Colombia',             code: 'COL' },
  { rank: 14,  name: 'Mexico',               code: 'MEX' },
  { rank: 15,  name: 'Senegal',              code: 'SEN' },
  { rank: 16,  name: 'Uruguay',              code: 'URU' },
  { rank: 17,  name: 'USA',                  code: 'USA' },
  { rank: 18,  name: 'Japan',                code: 'JPN' },
  { rank: 19,  name: 'Switzerland',          code: 'SUI' },
  { rank: 20,  name: 'Denmark',              code: 'DEN' },
  { rank: 21,  name: 'IR Iran',              code: 'IRN' },
  { rank: 22,  name: 'Türkiye',              code: 'TUR' },
  { rank: 23,  name: 'Ecuador',              code: 'ECU' },
  { rank: 24,  name: 'Austria',              code: 'AUT' },
  { rank: 25,  name: 'Korea Republic',       code: 'KOR' },
  { rank: 26,  name: 'Nigeria',              code: 'NGA' },
  { rank: 27,  name: 'Australia',            code: 'AUS' },
  { rank: 28,  name: 'Algeria',              code: 'ALG' },
  { rank: 29,  name: 'Egypt',                code: 'EGY' },
  { rank: 30,  name: 'Canada',               code: 'CAN' },
  { rank: 31,  name: 'Norway',               code: 'NOR' },
  { rank: 32,  name: 'Ukraine',              code: 'UKR' },
  { rank: 33,  name: "Côte d'Ivoire",        code: 'CIV' },
  { rank: 34,  name: 'Panama',               code: 'PAN' },
  { rank: 35,  name: 'Russia',               code: 'RUS' },
  { rank: 36,  name: 'Poland',               code: 'POL' },
  { rank: 37,  name: 'Wales',                code: 'WAL' },
  { rank: 38,  name: 'Sweden',               code: 'SWE' },
  { rank: 39,  name: 'Czechia',              code: 'CZE' },
  { rank: 40,  name: 'Paraguay',             code: 'PAR' },
  { rank: 41,  name: 'Hungary',              code: 'HUN' },
  { rank: 42,  name: 'Scotland',             code: 'SCO' },
  { rank: 43,  name: 'Serbia',               code: 'SRB' },
  { rank: 44,  name: 'Cameroon',             code: 'CMR' },
  { rank: 45,  name: 'Congo DR',             code: 'COD' },
  { rank: 46,  name: 'Tunisia',              code: 'TUN' },
  { rank: 47,  name: 'Slovakia',             code: 'SVK' },
  { rank: 48,  name: 'Greece',               code: 'GRE' },
  { rank: 49,  name: 'Venezuela',            code: 'VEN' },
  { rank: 50,  name: 'Uzbekistan',           code: 'UZB' },
  { rank: 51,  name: 'Peru',                 code: 'PER' },
  { rank: 52,  name: 'Costa Rica',           code: 'CRC' },
  { rank: 53,  name: 'Romania',              code: 'ROU' },
  { rank: 54,  name: 'Mali',                 code: 'MLI' },
  { rank: 55,  name: 'Chile',                code: 'CHI' },
  { rank: 56,  name: 'Iraq',                 code: 'IRQ' },
  { rank: 57,  name: 'Qatar',                code: 'QAT' },
  { rank: 58,  name: 'Republic of Ireland',  code: 'IRL' },
  { rank: 59,  name: 'Slovenia',             code: 'SVN' },
  { rank: 60,  name: 'South Africa',         code: 'RSA' },
  { rank: 61,  name: 'Saudi Arabia',         code: 'KSA' },
  { rank: 62,  name: 'Burkina Faso',         code: 'BFA' },
  { rank: 63,  name: 'Jordan',               code: 'JOR' },
  { rank: 64,  name: 'Bosnia and Herzegovina', code: 'BIH' },
  { rank: 65,  name: 'Honduras',             code: 'HON' },
  { rank: 66,  name: 'Albania',              code: 'ALB' },
  { rank: 67,  name: 'Cabo Verde',           code: 'CPV' },
  { rank: 68,  name: 'United Arab Emirates', code: 'UAE' },
  { rank: 69,  name: 'North Macedonia',      code: 'MKD' },
  { rank: 70,  name: 'Northern Ireland',     code: 'NIR' },
  { rank: 71,  name: 'Jamaica',              code: 'JAM' },
  { rank: 72,  name: 'Georgia',              code: 'GEO' },
  { rank: 73,  name: 'Ghana',                code: 'GHA' },
  { rank: 74,  name: 'Iceland',              code: 'ISL' },
  { rank: 75,  name: 'Finland',              code: 'FIN' },
  { rank: 76,  name: 'Israel',               code: 'ISR' },
  { rank: 77,  name: 'Bolivia',              code: 'BOL' },
  { rank: 78,  name: 'Kosovo',               code: 'KOS' },
  { rank: 79,  name: 'Oman',                 code: 'OMA' },
  { rank: 80,  name: 'Montenegro',           code: 'MNE' },
  { rank: 81,  name: 'Guinea',               code: 'GUI' },
  { rank: 82,  name: 'Curaçao',              code: 'CUW' },
  { rank: 83,  name: 'Haiti',                code: 'HAI' },
  { rank: 84,  name: 'Syria',                code: 'SYR' },
  { rank: 85,  name: 'New Zealand',          code: 'NZL' },
  { rank: 86,  name: 'Gabon',                code: 'GAB' },
  { rank: 87,  name: 'Bulgaria',             code: 'BUL' },
  { rank: 88,  name: 'Uganda',               code: 'UGA' },
  { rank: 89,  name: 'Angola',               code: 'ANG' },
  { rank: 90,  name: 'Benin',                code: 'BEN' },
  { rank: 91,  name: 'Zambia',               code: 'ZAM' },
  { rank: 92,  name: 'China PR',             code: 'CHN' },
  { rank: 93,  name: 'Bahrain',              code: 'BHR' },
  { rank: 94,  name: 'Thailand',             code: 'THA' },
  { rank: 95,  name: 'Palestine',            code: 'PLE' },
  { rank: 96,  name: 'Belarus',              code: 'BLR' },
  { rank: 97,  name: 'Guatemala',            code: 'GUA' },
  { rank: 98,  name: 'Luxembourg',           code: 'LUX' },
  { rank: 99,  name: 'Vietnam',              code: 'VIE' },
  { rank: 100, name: 'Tajikistan',           code: 'TJK' },
  { rank: 101, name: 'El Salvador',          code: 'SLV' },
  { rank: 102, name: 'Mozambique',           code: 'MOZ' },
  { rank: 103, name: 'Trinidad and Tobago',  code: 'TRI' },
  { rank: 104, name: 'Madagascar',           code: 'MAD' },
  { rank: 105, name: 'Equatorial Guinea',    code: 'EQG' },
];

// Reverse index for O(1) lookups by tri-code.
export const FIFA_RANK_BY_CODE: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const row of FIFA_RANKING) out[row.code] = row.rank;
  return out;
})();

// Reverse index for display name lookups.
export const FIFA_NAME_BY_CODE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const row of FIFA_RANKING) out[row.code] = row.name;
  return out;
})();
