import { biomeOfChapter } from './biomes';
import { BOSSES } from './bosses';
import { Coord, GemColor, LevelConfig, LevelDifficulty, LevelObjective } from './types';

interface CellSpec {
  row: number;
  col: number;
  hp: number;
}

// --- Small pattern helpers keep the 32 levels readable and typo-free ---------

function cells(r0: number, r1: number, c0: number, c1: number, hp = 1): CellSpec[] {
  const out: CellSpec[] = [];
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      out.push({ row: r, col: c, hp });
    }
  }
  return out;
}

function ring(pad: number, hp = 1): CellSpec[] {
  const lo = pad;
  const hi = 7 - pad;
  const out: CellSpec[] = [];
  for (let c = lo; c <= hi; c++) {
    out.push({ row: lo, col: c, hp });
    if (hi !== lo) out.push({ row: hi, col: c, hp });
  }
  for (let r = lo + 1; r <= hi - 1; r++) {
    out.push({ row: r, col: lo, hp });
    if (hi !== lo) out.push({ row: r, col: hi, hp });
  }
  return out;
}

function cross(row: number, col: number, hp = 1): CellSpec[] {
  const out: CellSpec[] = [];
  for (let i = 0; i < 8; i++) {
    out.push({ row, col: i, hp });
    if (i !== row) out.push({ row: i, col, hp });
  }
  return out;
}

function checker(r0: number, r1: number, c0: number, c1: number, hp = 1): CellSpec[] {
  const out: CellSpec[] = [];
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if ((r + c) % 2 === 0) out.push({ row: r, col: c, hp });
    }
  }
  return out;
}

function corners(hp = 1): CellSpec[] {
  return [
    ...cells(1, 2, 1, 2, hp),
    ...cells(1, 2, 5, 6, hp),
    ...cells(5, 6, 1, 2, hp),
    ...cells(5, 6, 5, 6, hp),
  ];
}

function chainAt(coords: Array<[number, number]>): Array<{ row: number; col: number }> {
  return coords.map(([row, col]) => ({ row, col }));
}

export const CAMPAIGN_CHAPTERS: Array<{ id: number; nameSv: string }> = [
  { id: 1, nameSv: 'Skogsgläntan' },
  { id: 2, nameSv: 'Frostklyftan' },
  { id: 3, nameSv: 'Kungsstugan' },
  { id: 4, nameSv: 'Stjärnvalvet' },
];

export const DIFFICULTY_META: Record<
  LevelDifficulty,
  { labelSv: string; badgeClass: string }
> = {
  easy: {
    labelSv: 'Lätt',
    badgeClass: 'border-[#10B981]/45 bg-[#10B981]/18 text-[#6EE7B7]',
  },
  medium: {
    labelSv: 'Medel',
    badgeClass: 'border-[#F5B841]/45 bg-[#F5B841]/16 text-[#FDE047]',
  },
  hard: {
    labelSv: 'Svår',
    badgeClass: 'border-[#FB7185]/45 bg-[#FB7185]/16 text-[#FDA4AF]',
  },
  extreme: {
    labelSv: 'Extrem',
    badgeClass: 'border-[#A855F7]/50 bg-[#A855F7]/18 text-[#D8B4FE]',
  },
};

export const CAMPAIGN_LEVELS: LevelConfig[] = [
  // ---------------- Chapter 1 · Skogsgläntan ----------------
  {
    id: 1,
    chapter: 1,
    difficulty: 'easy',
    name: 'Skogsgläntan',
    subtitle: 'Samla gulliga djur och skapa strålkombos',
    moves: 18,
    colorCount: 5,
    objectives: [
      { id: 'l1-ruby', kind: 'color', color: 'ruby', label: 'Räv', target: 16 },
      { id: 'l1-cobalt', kind: 'color', color: 'cobalt', label: 'Pingvin', target: 16 },
    ],
  },
  {
    id: 2,
    chapter: 1,
    difficulty: 'easy',
    name: 'Rimfrost',
    subtitle: 'Matcha ovanpå frostade rutor för att tina dem',
    moves: 20,
    colorCount: 5,
    objectives: [
      { id: 'l2-ice', kind: 'ice', label: 'Isrutor', target: 12 },
      { id: 'l2-emerald', kind: 'color', color: 'emerald', label: 'Groda', target: 18 },
    ],
    iceCells: [
      { row: 2, col: 3, hp: 1 },
      { row: 2, col: 4, hp: 1 },
      { row: 3, col: 2, hp: 1 },
      { row: 3, col: 3, hp: 1 },
      { row: 3, col: 4, hp: 1 },
      { row: 3, col: 5, hp: 1 },
      { row: 4, col: 2, hp: 1 },
      { row: 4, col: 3, hp: 1 },
      { row: 4, col: 4, hp: 1 },
      { row: 4, col: 5, hp: 1 },
      { row: 5, col: 3, hp: 1 },
      { row: 5, col: 4, hp: 1 },
    ],
  },
  {
    id: 3,
    chapter: 1,
    difficulty: 'medium',
    name: 'Låsta Trälådor',
    subtitle: 'Spräck trälådor genom att matcha intill dem',
    moves: 22,
    colorCount: 5,
    objectives: [
      { id: 'l3-crate', kind: 'crate', label: 'Trälådor', target: 8 },
      { id: 'l3-amber', kind: 'color', color: 'amber', label: 'Lejon', target: 20 },
    ],
    crateCells: [
      { row: 2, col: 2, hp: 1 },
      { row: 2, col: 5, hp: 1 },
      { row: 3, col: 3, hp: 2 },
      { row: 3, col: 4, hp: 2 },
      { row: 4, col: 3, hp: 2 },
      { row: 4, col: 4, hp: 2 },
      { row: 5, col: 2, hp: 1 },
      { row: 5, col: 5, hp: 1 },
    ],
  },
  {
    id: 4,
    chapter: 1,
    difficulty: 'medium',
    name: 'Kedjevalv',
    subtitle: 'Lås upp kedjade djur genom att matcha dem på plats',
    moves: 22,
    colorCount: 5,
    objectives: [
      { id: 'l4-chain', kind: 'chain', label: 'Kedjor', target: 8 },
      { id: 'l4-ice', kind: 'ice', label: 'Isrutor', target: 8 },
    ],
    chainCells: [
      { row: 2, col: 1 },
      { row: 2, col: 6 },
      { row: 3, col: 2 },
      { row: 3, col: 5 },
      { row: 4, col: 2 },
      { row: 4, col: 5 },
      { row: 5, col: 1 },
      { row: 5, col: 6 },
    ],
    iceCells: [
      { row: 3, col: 3, hp: 1 },
      { row: 3, col: 4, hp: 1 },
      { row: 4, col: 3, hp: 1 },
      { row: 4, col: 4, hp: 1 },
      { row: 1, col: 3, hp: 1 },
      { row: 1, col: 4, hp: 1 },
      { row: 6, col: 3, hp: 1 },
      { row: 6, col: 4, hp: 1 },
    ],
  },
  {
    id: 5,
    chapter: 1,
    difficulty: 'medium',
    name: 'Prismakammaren',
    subtitle: 'Sex djurvänner — kombinera specialare för kedjereaktioner',
    moves: 24,
    colorCount: 6,
    objectives: [
      { id: 'l5-ice', kind: 'ice', label: 'Isrutor', target: 14 },
      { id: 'l5-crate', kind: 'crate', label: 'Trälådor', target: 6 },
      { id: 'l5-amethyst', kind: 'color', color: 'amethyst', label: 'Kanin', target: 22 },
    ],
    crateCells: [
      { row: 3, col: 1, hp: 1 },
      { row: 4, col: 1, hp: 1 },
      { row: 3, col: 6, hp: 1 },
      { row: 4, col: 6, hp: 1 },
      { row: 1, col: 3, hp: 2 },
      { row: 1, col: 4, hp: 2 },
    ],
    iceCells: [
      { row: 2, col: 2, hp: 1 },
      { row: 2, col: 3, hp: 1 },
      { row: 2, col: 4, hp: 1 },
      { row: 2, col: 5, hp: 1 },
      { row: 5, col: 2, hp: 1 },
      { row: 5, col: 3, hp: 1 },
      { row: 5, col: 4, hp: 1 },
      { row: 5, col: 5, hp: 1 },
      { row: 6, col: 2, hp: 2 },
      { row: 6, col: 3, hp: 2 },
      { row: 6, col: 4, hp: 2 },
      { row: 6, col: 5, hp: 2 },
      { row: 3, col: 3, hp: 1 },
      { row: 4, col: 4, hp: 1 },
    ],
  },
  {
    id: 6,
    chapter: 1,
    difficulty: 'hard',
    name: 'Stjärnkorset',
    subtitle: 'Använd strålar för att slå igenom lådbarriärer',
    moves: 24,
    colorCount: 6,
    objectives: [
      { id: 'l6-crate', kind: 'crate', label: 'Trälådor', target: 12 },
      { id: 'l6-chain', kind: 'chain', label: 'Kedjor', target: 6 },
    ],
    crateCells: [
      { row: 1, col: 3, hp: 2 },
      { row: 2, col: 3, hp: 1 },
      { row: 5, col: 4, hp: 1 },
      { row: 6, col: 4, hp: 2 },
      { row: 3, col: 1, hp: 1 },
      { row: 3, col: 2, hp: 2 },
      { row: 3, col: 5, hp: 2 },
      { row: 3, col: 6, hp: 1 },
      { row: 4, col: 1, hp: 1 },
      { row: 4, col: 2, hp: 2 },
      { row: 4, col: 5, hp: 2 },
      { row: 4, col: 6, hp: 1 },
    ],
    chainCells: [
      { row: 0, col: 3 },
      { row: 0, col: 4 },
      { row: 3, col: 3 },
      { row: 4, col: 4 },
      { row: 7, col: 3 },
      { row: 7, col: 4 },
    ],
  },
  {
    id: 7,
    chapter: 1,
    difficulty: 'hard',
    name: 'Djupfrostens Hjärta',
    subtitle: 'Dubbellagrad permafrost kräver upprepade träffar',
    moves: 26,
    colorCount: 6,
    objectives: [
      { id: 'l7-ice', kind: 'ice', label: 'Isrutor', target: 20 },
      { id: 'l7-quartz', kind: 'color', color: 'quartz', label: 'Isbjörn', target: 24 },
    ],
    iceCells: [
      { row: 1, col: 2, hp: 1 },
      { row: 1, col: 3, hp: 2 },
      { row: 1, col: 4, hp: 2 },
      { row: 1, col: 5, hp: 1 },
      { row: 2, col: 2, hp: 2 },
      { row: 2, col: 3, hp: 2 },
      { row: 2, col: 4, hp: 2 },
      { row: 2, col: 5, hp: 2 },
      { row: 3, col: 1, hp: 1 },
      { row: 3, col: 2, hp: 2 },
      { row: 3, col: 5, hp: 2 },
      { row: 3, col: 6, hp: 1 },
      { row: 4, col: 1, hp: 1 },
      { row: 4, col: 2, hp: 2 },
      { row: 4, col: 5, hp: 2 },
      { row: 4, col: 6, hp: 1 },
      { row: 5, col: 2, hp: 2 },
      { row: 5, col: 3, hp: 1 },
      { row: 5, col: 4, hp: 1 },
      { row: 5, col: 5, hp: 2 },
    ],
    chainCells: [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ],
  },
  {
    id: 8,
    chapter: 1,
    difficulty: 'hard',
    name: 'Mästarprovet',
    subtitle: 'Alla mekaniker förenade i alkemistens sista kammare',
    moves: 28,
    colorCount: 6,
    objectives: [
      { id: 'l8-ice', kind: 'ice', label: 'Isrutor', target: 16 },
      { id: 'l8-crate', kind: 'crate', label: 'Trälådor', target: 10 },
      { id: 'l8-chain', kind: 'chain', label: 'Kedjor', target: 8 },
    ],
    crateCells: [
      { row: 1, col: 1, hp: 2 },
      { row: 1, col: 6, hp: 2 },
      { row: 3, col: 3, hp: 2 },
      { row: 3, col: 4, hp: 2 },
      { row: 4, col: 3, hp: 2 },
      { row: 4, col: 4, hp: 2 },
      { row: 6, col: 1, hp: 2 },
      { row: 6, col: 6, hp: 2 },
      { row: 2, col: 0, hp: 1 },
      { row: 2, col: 7, hp: 1 },
    ],
    iceCells: [
      { row: 2, col: 2, hp: 2 },
      { row: 2, col: 3, hp: 1 },
      { row: 2, col: 4, hp: 1 },
      { row: 2, col: 5, hp: 2 },
      { row: 5, col: 2, hp: 2 },
      { row: 5, col: 3, hp: 1 },
      { row: 5, col: 4, hp: 1 },
      { row: 5, col: 5, hp: 2 },
      { row: 3, col: 1, hp: 1 },
      { row: 4, col: 1, hp: 1 },
      { row: 3, col: 6, hp: 1 },
      { row: 4, col: 6, hp: 1 },
      { row: 6, col: 2, hp: 2 },
      { row: 6, col: 3, hp: 2 },
      { row: 6, col: 4, hp: 2 },
      { row: 6, col: 5, hp: 2 },
    ],
    chainCells: [
      { row: 0, col: 2 },
      { row: 0, col: 5 },
      { row: 3, col: 2 },
      { row: 3, col: 5 },
      { row: 4, col: 2 },
      { row: 4, col: 5 },
      { row: 7, col: 2 },
      { row: 7, col: 5 },
    ],
  },

  // ---------------- Chapter 2 · Frostklyftan ----------------
  {
    id: 9,
    chapter: 2,
    difficulty: 'medium',
    name: 'Frostbryggan',
    subtitle: 'En ring av frost binder bron — tina upp vägen framåt',
    moves: 22,
    colorCount: 5,
    objectives: [
      { id: 'l9-ice', kind: 'ice', label: 'Isrutor', target: 16 },
      { id: 'l9-sky', kind: 'color', color: 'sky', label: 'Delfin', target: 20 },
    ],
    iceCells: ring(1, 1),
  },
  {
    id: 10,
    chapter: 2,
    difficulty: 'medium',
    name: 'Isvinden',
    subtitle: 'Två ispelare delar brädet — matcha igenom dem',
    moves: 17,
    colorCount: 5,
    objectives: [
      { id: 'l10-ice', kind: 'ice', label: 'Isrutor', target: 14 },
      { id: 'l10-emerald', kind: 'color', color: 'emerald', label: 'Groda', target: 24 },
    ],
    iceCells: [...cells(0, 7, 2, 2, 1), ...cells(0, 7, 5, 5, 1)],
  },
  {
    id: 11,
    chapter: 2,
    difficulty: 'hard',
    name: 'Glaciärgrinden',
    subtitle: 'Frysta hörn och en låst kärna i mitten',
    moves: 14,
    colorCount: 5,
    objectives: [
      { id: 'l11-ice', kind: 'ice', label: 'Isrutor', target: 12 },
      { id: 'l11-crate', kind: 'crate', label: 'Trälådor', target: 4 },
    ],
    iceCells: corners(1),
    crateCells: cells(3, 4, 3, 4, 2),
  },
  {
    id: 12,
    chapter: 2,
    difficulty: 'hard',
    name: 'Snöstormen',
    subtitle: 'Frostringen sluter sig — samla poäng medan du tinar',
    moves: 18,
    colorCount: 6,
    objectives: [
      { id: 'l12-ice', kind: 'ice', label: 'Isrutor', target: 16 },
      { id: 'l12-score', kind: 'score', label: 'Poäng', target: 3000 },
    ],
    iceCells: ring(1, 1),
  },
  {
    id: 13,
    chapter: 2,
    difficulty: 'hard',
    name: 'Kallkammaren',
    subtitle: 'Ett iskors genom hela brädet',
    moves: 25,
    colorCount: 6,
    objectives: [
      { id: 'l13-ice', kind: 'ice', label: 'Isrutor', target: 12 },
      { id: 'l13-amethyst', kind: 'color', color: 'amethyst', label: 'Kanin', target: 24 },
    ],
    iceCells: cross(3, 4, 1),
  },
  {
    id: 14,
    chapter: 2,
    difficulty: 'hard',
    name: 'Frostens Väktare',
    subtitle: 'Tjock is i hörnen och kedjade djur i mitten',
    moves: 18,
    colorCount: 6,
    objectives: [
      { id: 'l14-ice', kind: 'ice', label: 'Isrutor', target: 24 },
      { id: 'l14-chain', kind: 'chain', label: 'Kedjor', target: 5 },
    ],
    iceCells: corners(2),
    chainCells: chainAt([
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
      [2, 3],
      [2, 4],
    ]),
  },
  {
    id: 15,
    chapter: 2,
    difficulty: 'hard',
    name: 'Vinterträdgården',
    subtitle: 'Två frostrader och en eftertraktad isbjörn',
    moves: 26,
    colorCount: 6,
    objectives: [
      { id: 'l15-ice', kind: 'ice', label: 'Isrutor', target: 14 },
      { id: 'l15-quartz', kind: 'color', color: 'quartz', label: 'Isbjörn', target: 26 },
    ],
    iceCells: [...cells(1, 1, 0, 7, 1), ...cells(6, 6, 0, 7, 1)],
  },
  {
    id: 16,
    chapter: 2,
    difficulty: 'extreme',
    name: 'Isdrottningens Sal',
    subtitle: 'Hela salen är frusen — fyra lådor låser mitten',
    moves: 23,
    colorCount: 6,
    objectives: [
      { id: 'l16-ice', kind: 'ice', label: 'Isrutor', target: 22 },
      { id: 'l16-crate', kind: 'crate', label: 'Trälådor', target: 4 },
    ],
    iceCells: ring(0, 1),
    crateCells: cells(3, 4, 3, 4, 2),
  },

  // ---------------- Chapter 3 · Kungsstugan ----------------
  {
    id: 17,
    chapter: 3,
    difficulty: 'medium',
    name: 'Kungliga Förrådet',
    subtitle: 'Två rader av lådor skyddar kungens förråd',
    moves: 20,
    colorCount: 5,
    objectives: [
      { id: 'l17-crate', kind: 'crate', label: 'Trälådor', target: 10 },
      { id: 'l17-amber', kind: 'color', color: 'amber', label: 'Lejon', target: 26 },
    ],
    crateCells: [...cells(2, 2, 1, 6, 1), ...cells(5, 5, 1, 6, 1)],
  },
  {
    id: 18,
    chapter: 3,
    difficulty: 'medium',
    name: 'Kedjeborgen',
    subtitle: 'Ett kors av kedjor håller borgen samman',
    moves: 18,
    colorCount: 5,
    objectives: [
      { id: 'l18-chain', kind: 'chain', label: 'Kedjor', target: 12 },
      { id: 'l18-cobalt', kind: 'color', color: 'cobalt', label: 'Pingvin', target: 26 },
    ],
    chainCells: chainAt(
      cross(4, 4).map(({ row, col }) => [row, col] as [number, number])
    ),
  },
  {
    id: 19,
    chapter: 3,
    difficulty: 'hard',
    name: 'Skattkammaren',
    subtitle: 'Fyra lådbankar och ett högt poängmål',
    moves: 26,
    colorCount: 6,
    objectives: [
      { id: 'l19-crate', kind: 'crate', label: 'Trälådor', target: 12 },
      { id: 'l19-score', kind: 'score', label: 'Poäng', target: 3800 },
    ],
    crateCells: corners(2),
  },
  {
    id: 20,
    chapter: 3,
    difficulty: 'hard',
    name: 'Kronans Kammare',
    subtitle: 'Kedjor i mitten och frost längs kanterna',
    moves: 16,
    colorCount: 6,
    objectives: [
      { id: 'l20-chain', kind: 'chain', label: 'Kedjor', target: 6 },
      { id: 'l20-ice', kind: 'ice', label: 'Isrutor', target: 12 },
    ],
    chainCells: chainAt(
      checker(2, 5, 2, 5).map(({ row, col }) => [row, col] as [number, number])
    ),
    iceCells: [...cells(1, 1, 0, 7, 1), ...cells(6, 6, 0, 7, 1)],
  },
  {
    id: 21,
    chapter: 3,
    difficulty: 'hard',
    name: 'Riddarsalen',
    subtitle: 'Inga hinder — bara skickliga specialare och poäng',
    moves: 14,
    colorCount: 6,
    objectives: [
      { id: 'l21-specials', kind: 'specials', label: 'Specialare', target: 4 },
      { id: 'l21-score', kind: 'score', label: 'Poäng', target: 3000 },
    ],
  },
  {
    id: 22,
    chapter: 3,
    difficulty: 'hard',
    name: 'Tronsalen',
    subtitle: 'Kungens tron är låst med lådor och fyra kedjor',
    moves: 23,
    colorCount: 6,
    objectives: [
      { id: 'l22-crate', kind: 'crate', label: 'Trälådor', target: 10 },
      { id: 'l22-chain', kind: 'chain', label: 'Kedjor', target: 4 },
    ],
    crateCells: [...cells(1, 6, 1, 1, 1), ...cells(1, 6, 6, 6, 1)],
    chainCells: chainAt([
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
    ]),
  },
  {
    id: 23,
    chapter: 3,
    difficulty: 'hard',
    name: 'Smyckeskrinet',
    subtitle: 'Smycken i alla färger — samla kaninerna och smid specialare',
    moves: 26,
    colorCount: 6,
    objectives: [
      { id: 'l23-violet', kind: 'color', color: 'violet', label: 'Panda', target: 26 },
      { id: 'l23-specials', kind: 'specials', label: 'Specialare', target: 4 },
    ],
  },
  {
    id: 24,
    chapter: 3,
    difficulty: 'extreme',
    name: 'Kungens Prov',
    subtitle: 'Lådor, frost och kedjor i samma kammare',
    moves: 30,
    colorCount: 6,
    objectives: [
      { id: 'l24-crate', kind: 'crate', label: 'Trälådor', target: 12 },
      { id: 'l24-ice', kind: 'ice', label: 'Isrutor', target: 8 },
      { id: 'l24-chain', kind: 'chain', label: 'Kedjor', target: 6 },
    ],
    crateCells: corners(1),
    iceCells: cells(3, 4, 2, 5, 1),
    chainCells: chainAt([
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [7, 2],
      [7, 3],
      [7, 4],
      [7, 5],
    ]),
  },

  // ---------------- Chapter 4 · Stjärnvalvet ----------------
  {
    id: 25,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Stjärnfall',
    subtitle: 'Bygg kaskader under stjärnorna',
    moves: 14,
    colorCount: 6,
    objectives: [
      { id: 'l25-cascade', kind: 'cascade3', label: 'Kaskad ×3+', target: 3 },
      { id: 'l25-score', kind: 'score', label: 'Poäng', target: 5500 },
    ],
  },
  {
    id: 26,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Nebulosan',
    subtitle: 'Ett hav av möjligheter — smid många specialare',
    moves: 20,
    colorCount: 6,
    objectives: [
      { id: 'l26-specials', kind: 'specials', label: 'Specialare', target: 6 },
      { id: 'l26-score', kind: 'score', label: 'Poäng', target: 6000 },
    ],
  },
  {
    id: 27,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Kometer',
    subtitle: 'Tjock is i alla hörn och en låst kärna',
    moves: 17,
    colorCount: 6,
    objectives: [
      { id: 'l27-ice', kind: 'ice', label: 'Isrutor', target: 24 },
      { id: 'l27-crate', kind: 'crate', label: 'Trälådor', target: 4 },
    ],
    iceCells: corners(2),
    crateCells: cells(3, 4, 3, 4, 2),
  },
  {
    id: 28,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Mörka Matteriet',
    subtitle: 'Kedjerader genom ett fruset yttervarv',
    moves: 30,
    colorCount: 6,
    objectives: [
      { id: 'l28-chain', kind: 'chain', label: 'Kedjor', target: 10 },
      { id: 'l28-ice', kind: 'ice', label: 'Isrutor', target: 20 },
    ],
    chainCells: chainAt([
      [3, 1],
      [3, 2],
      [3, 3],
      [3, 4],
      [3, 5],
      [3, 6],
      [4, 1],
      [4, 2],
      [4, 3],
      [4, 4],
      [4, 5],
      [4, 6],
    ]),
    iceCells: ring(0, 1),
  },
  {
    id: 29,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Prismastormen',
    subtitle: 'Ett sista prov i specialare och poäng',
    moves: 16,
    colorCount: 6,
    objectives: [
      { id: 'l29-specials', kind: 'specials', label: 'Specialare', target: 6 },
      { id: 'l29-score', kind: 'score', label: 'Poäng', target: 7500 },
    ],
  },
  {
    id: 30,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Kristalltornet',
    subtitle: 'Två lådpelare och ett tjockt isband i mitten',
    moves: 17,
    colorCount: 6,
    objectives: [
      { id: 'l30-crate', kind: 'crate', label: 'Trälådor', target: 10 },
      { id: 'l30-ice', kind: 'ice', label: 'Isrutor', target: 12 },
    ],
    crateCells: [...cells(1, 6, 1, 1, 1), ...cells(1, 6, 6, 6, 1)],
    iceCells: cells(3, 4, 2, 5, 2),
  },
  {
    id: 31,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Evighetens Port',
    subtitle: 'Halva brädet är täckt av dubbel is',
    moves: 20,
    colorCount: 6,
    objectives: [
      { id: 'l31-ice', kind: 'ice', label: 'Isrutor', target: 30 },
      { id: 'l31-chain', kind: 'chain', label: 'Kedjor', target: 6 },
    ],
    iceCells: checker(0, 7, 0, 7, 2),
    chainCells: chainAt([
      [0, 0],
      [0, 7],
      [7, 0],
      [7, 7],
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
    ]),
  },
  {
    id: 32,
    chapter: 4,
    difficulty: 'extreme',
    name: 'Djurrikets Hjärta',
    subtitle: 'Alla mekaniker i det sista mästarprovet',
    moves: 36,
    colorCount: 6,
    objectives: [
      { id: 'l32-crate', kind: 'crate', label: 'Trälådor', target: 12 },
      { id: 'l32-ice', kind: 'ice', label: 'Isrutor', target: 14 },
      { id: 'l32-chain', kind: 'chain', label: 'Kedjor', target: 6 },
    ],
    crateCells: [
      ...cells(2, 3, 1, 2, 2),
      ...cells(2, 3, 5, 6, 2),
      ...cells(4, 5, 1, 2, 2),
      ...cells(4, 5, 5, 6, 2),
    ],
    iceCells: [...cells(0, 0, 0, 7, 1), ...cells(7, 7, 0, 7, 1)],
    chainCells: chainAt([
      [2, 3],
      [2, 4],
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
      [5, 3],
      [5, 4],
    ]),
  },
];

// New animals join the crew as the player advances. The palette is sliced to
// the level's colorCount, so 5-color levels simply leave the last animal home.
const TIGER_CREW: GemColor[] = ['ruby', 'tangerine', 'emerald', 'cobalt', 'amethyst', 'quartz'];
const OWL_CREW: GemColor[] = ['ruby', 'tangerine', 'emerald', 'cobalt', 'rose', 'quartz'];

const LEVEL_CREWS: Record<number, GemColor[]> = {
  4: TIGER_CREW,
  5: TIGER_CREW,
  6: TIGER_CREW,
  7: OWL_CREW,
  8: OWL_CREW,
};

const CHAPTER_CREWS: Record<number, GemColor[]> = {
  2: ['ruby', 'tangerine', 'emerald', 'sky', 'amethyst', 'quartz'],
  3: ['rose', 'amber', 'lime', 'cobalt', 'violet', 'quartz'],
  4: ['rose', 'tangerine', 'mint', 'cobalt', 'violet', 'quartz'],
};

for (const level of CAMPAIGN_LEVELS) {
  const crew = LEVEL_CREWS[level.id] ?? (level.chapter ? CHAPTER_CREWS[level.chapter] : undefined);
  if (crew) level.palette = crew;
}

export const ENDLESS_CONFIG: LevelConfig = {
  id: 0,
  name: 'Oändligt läge',
  subtitle: 'Bygg kaskadkedjor, ladda verktyg och jaga rekord',
  moves: 30,
  colorCount: 6,
  objectives: [
    { id: 'endless-score', kind: 'score', label: 'Målpoäng (bonus +5 drag)', target: 2500 },
  ],
};

// ---------------------------------------------------------------------------
// The long campaign
//
// The first 32 levels above are hand-made and teach every mechanic. Everything
// after that is generated from the level number alone, so the same level is
// identical on every device and nothing has to be stored or downloaded.
// ---------------------------------------------------------------------------

export const LEVELS_PER_CHAPTER = 8;
export const CAMPAIGN_CHAPTER_COUNT = 3000;
export const CAMPAIGN_LEVEL_COUNT = CAMPAIGN_CHAPTER_COUNT * LEVELS_PER_CHAPTER;

/** Chapter names are "<adjective> <place>", e.g. "Dimmiga dalen". */
const CHAPTER_ADJECTIVES: Array<{ nameSv: string }> = [
  { nameSv: 'Dimmiga' }, { nameSv: 'Gyllene' }, { nameSv: 'Tysta' }, { nameSv: 'Frusna' },
  { nameSv: 'Soliga' }, { nameSv: 'Glittrande' }, { nameSv: 'Gömda' }, { nameSv: 'Vilda' },
  { nameSv: 'Blommande' }, { nameSv: 'Stormiga' }, { nameSv: 'Lugna' }, { nameSv: 'Förtrollade' },
  { nameSv: 'Mossiga' }, { nameSv: 'Snöiga' }, { nameSv: 'Varma' }, { nameSv: 'Djupa' },
  { nameSv: 'Höga' }, { nameSv: 'Gröna' }, { nameSv: 'Blå' }, { nameSv: 'Röda' },
  { nameSv: 'Silvriga' }, { nameSv: 'Skimrande' }, { nameSv: 'Viskande' }, { nameSv: 'Sjungande' },
  { nameSv: 'Dansande' }, { nameSv: 'Sovande' }, { nameSv: 'Glömda' }, { nameSv: 'Hemliga' },
  { nameSv: 'Regniga' }, { nameSv: 'Blåsiga' }, { nameSv: 'Kyliga' }, { nameSv: 'Ljusa' },
  { nameSv: 'Mörka' }, { nameSv: 'Gamla' }, { nameSv: 'Unga' }, { nameSv: 'Stora' },
  { nameSv: 'Lilla' }, { nameSv: 'Lekfulla' }, { nameSv: 'Modiga' }, { nameSv: 'Busiga' },
  { nameSv: 'Kluriga' }, { nameSv: 'Glada' }, { nameSv: 'Stjärnklara' }, { nameSv: 'Månljusa' },
  { nameSv: 'Daggiga' }, { nameSv: 'Frostiga' }, { nameSv: 'Doftande' }, { nameSv: 'Porlande' },
  { nameSv: 'Brusande' }, { nameSv: 'Kristallklara' }, { nameSv: 'Bärnstensgula' }, { nameSv: 'Smaragdgröna' },
  { nameSv: 'Rosa' }, { nameSv: 'Violetta' }, { nameSv: 'Magiska' }, { nameSv: 'Eviga' },
];

const CHAPTER_PLACES: Array<{ nameSv: string }> = [
  { nameSv: 'dalen' }, { nameSv: 'ängen' }, { nameSv: 'skogen' }, { nameSv: 'sjön' },
  { nameSv: 'berget' }, { nameSv: 'stranden' }, { nameSv: 'ön' }, { nameSv: 'floden' },
  { nameSv: 'grottan' }, { nameSv: 'lunden' }, { nameSv: 'kullen' }, { nameSv: 'heden' },
  { nameSv: 'viken' }, { nameSv: 'träsket' }, { nameSv: 'savannen' }, { nameSv: 'djungeln' },
  { nameSv: 'tundran' }, { nameSv: 'öknen' }, { nameSv: 'oasen' }, { nameSv: 'revet' },
  { nameSv: 'lagunen' }, { nameSv: 'klippan' }, { nameSv: 'forsen' }, { nameSv: 'bäcken' },
  { nameSv: 'dammen' }, { nameSv: 'hagen' }, { nameSv: 'trädgården' }, { nameSv: 'gläntan' },
  { nameSv: 'stigen' }, { nameSv: 'bron' }, { nameSv: 'ravinen' }, { nameSv: 'glaciären' },
  { nameSv: 'fjorden' }, { nameSv: 'udden' }, { nameSv: 'holmen' }, { nameSv: 'myren' },
  { nameSv: 'backen' }, { nameSv: 'toppen' }, { nameSv: 'slätten' }, { nameSv: 'kusten' },
  { nameSv: 'bukten' }, { nameSv: 'källan' }, { nameSv: 'fallet' }, { nameSv: 'parken' },
  { nameSv: 'bambuskogen' }, { nameSv: 'korallrevet' }, { nameSv: 'isfältet' }, { nameSv: 'höglandet' },
  { nameSv: 'äppellunden' }, { nameSv: 'vassen' }, { nameSv: 'sanddynen' }, { nameSv: 'bergspasset' },
  { nameSv: 'blomsterfältet' }, { nameSv: 'tallskogen' }, { nameSv: 'björkhagen' }, { nameSv: 'vattenhålet' },
];

export interface CampaignChapter {
  id: number;
  nameSv: string;
}

export function getChapter(id: number): CampaignChapter {
  const chapter = Math.min(CAMPAIGN_CHAPTER_COUNT, Math.max(1, Math.round(id)));
  const handMade = CAMPAIGN_CHAPTERS.find((ch) => ch.id === chapter);
  if (handMade) return handMade;
  const idx = chapter - CAMPAIGN_CHAPTERS.length - 1;
  const places = CHAPTER_PLACES.length;
  const adjectives = CHAPTER_ADJECTIVES.length;
  const place = idx % places;
  // The shift makes neighbouring chapters differ in both words while still
  // giving every (adjective, place) pair exactly once before any repeat.
  const adjective = (Math.floor(idx / places) + place * 17) % adjectives;
  return {
    id: chapter,
    nameSv: `${CHAPTER_ADJECTIVES[adjective].nameSv} ${CHAPTER_PLACES[place].nameSv}`,
  };
}

export function chapterOfLevelIdx(levelIdx: number): number {
  return Math.floor(Math.max(0, levelIdx) / LEVELS_PER_CHAPTER) + 1;
}

function seededRng(seed: number): () => number {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** One animal from each colour family, so a crew never has two look-alikes. */
const COLOR_FAMILIES: GemColor[][] = [
  ['ruby', 'rose'],
  ['amber', 'tangerine'],
  ['emerald', 'lime', 'mint'],
  ['cobalt', 'sky'],
  ['amethyst', 'violet'],
  ['quartz'],
];

export function chapterCrew(chapter: number): GemColor[] {
  const rng = seededRng(chapter * 7919 + 13);
  const crew = COLOR_FAMILIES.map((family) => family[Math.floor(rng() * family.length)]);
  for (let i = crew.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [crew[i], crew[j]] = [crew[j], crew[i]];
  }
  return crew;
}

type Mask = Set<string>;
const key = (row: number, col: number) => `${row},${col}`;

function maskOf(specs: Array<{ row: number; col: number }>): Mask {
  return new Set(specs.map((s) => key(s.row, s.col)));
}

/** A random pattern mirrored left-right, top-bottom or both. */
function mirroredMask(rng: () => number, density: number): Mask {
  const mode = Math.floor(rng() * 3);
  const mask: Mask = new Set();
  const rows = mode === 1 ? 8 : 4;
  const cols = mode === 2 ? 8 : 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() >= density) continue;
      mask.add(key(r, c));
      if (mode !== 2) mask.add(key(r, 7 - c));
      if (mode !== 1) mask.add(key(7 - r, c));
      if (mode === 0) mask.add(key(7 - r, 7 - c));
    }
  }
  return mask;
}

function shapeMask(rng: () => number, density: number): Mask {
  const pick = Math.floor(rng() * 10);
  switch (pick) {
    case 0:
      return maskOf(ring(1 + Math.floor(rng() * 2)));
    case 1:
      return maskOf(cross(3 + Math.floor(rng() * 2), 3 + Math.floor(rng() * 2)));
    case 2:
      return maskOf(checker(1, 6, 1, 6));
    case 3:
      return maskOf(corners());
    case 4: {
      const top = 2 + Math.floor(rng() * 3);
      return maskOf(cells(top, top + 1, 0, 7));
    }
    case 5: {
      const left = 2 + Math.floor(rng() * 3);
      return maskOf(cells(1, 7, left, left + 1));
    }
    case 6:
      return maskOf(cells(2, 5, 2, 5));
    case 7: {
      // Diamond
      const out: Mask = new Set();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const d = Math.abs(r - 3.5) + Math.abs(c - 3.5);
          if (d <= 3 && d >= 2) out.add(key(r, c));
        }
      }
      return out;
    }
    default:
      return mirroredMask(rng, density);
  }
}

function trimMask(mask: Mask, rng: () => number, max: number, maxPerRow = 8, skipTopRow = false): Mask {
  let list = Array.from(mask).filter((k) => !(skipTopRow && k.startsWith('0,')));
  // Deterministic shuffle, then keep at most `maxPerRow` per row and `max` in total.
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  const perRow = new Map<string, number>();
  list = list.filter((k) => {
    const row = k.split(',')[0];
    const n = perRow.get(row) ?? 0;
    if (n >= maxPerRow) return false;
    perRow.set(row, n + 1);
    return true;
  });
  return new Set(list.slice(0, max));
}

function specsOf(mask: Mask, hp: (row: number, col: number) => number): CellSpec[] {
  return Array.from(mask)
    .map((k) => k.split(',').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([row, col]) => ({ row, col, hp: hp(row, col) }));
}

/** Difficulty curve inside a chapter: a gentle start, a hard finale. */
const CHAPTER_CURVE: LevelDifficulty[] = [
  'easy', 'easy', 'medium', 'medium', 'hard', 'medium', 'hard', 'extreme',
];

/**
 * Share of the move budget that a focused player needs, per difficulty: the
 * rest is the margin. Tuned with `tools/simulateLevels.ts`, a bot that looks
 * one move ahead and never uses tools.
 */
const EFFORT_SHARE: Record<LevelDifficulty, number> = {
  easy: 0.5,
  medium: 0.68,
  hard: 0.86,
  extreme: 1.02,
};

/**
 * What one focused move achieves on average with six animals on the board
 * (measured with the same bot). With only five animals, matches chain into
 * much longer cascades, so everything goes about 1.8 times faster.
 */
const FIVE_ANIMAL_BOOST = 1.8;
const RATE = {
  ice: 2.4,
  crateHp: 1.3,
  chain: 1.2,
  special: 0.9,
  cascade3: 0.55,
  score: 800,
  honey: 0.8,
  egg: 0.25,
  boss: 9,
  oneColor: 3.0,
  twoColors: 2.5,
};

const BASE_MOVES: Record<LevelDifficulty, [number, number]> = {
  easy: [18, 22],
  medium: [21, 26],
  hard: [24, 30],
  extreme: [27, 34],
};

function generateLevel(levelIdx: number): LevelConfig {
  const id = levelIdx + 1;
  const chapter = chapterOfLevelIdx(levelIdx);
  const pos = levelIdx % LEVELS_PER_CHAPTER;
  const rng = seededRng(id * 2654435761);
  const difficulty = CHAPTER_CURVE[pos];
  const rank = { easy: 0, medium: 1, hard: 2, extreme: 3 }[difficulty];

  const colorCount = rank >= 2 ? (rng() < 0.75 ? 6 : 5) : rng() < 0.2 ? 6 : 5;
  const palette = chapterCrew(chapter);

  // --- Obstacles ---------------------------------------------------------
  let useIce = false;
  let useCrates = false;
  let useChains = false;
  const roll = rng();
  if (rank === 0) {
    useIce = roll < 0.45;
  } else if (rank === 1) {
    if (roll < 0.3) useIce = true;
    else if (roll < 0.55) useCrates = true;
    else if (roll < 0.75) useChains = true;
    else if (roll < 0.9) useIce = useChains = true;
  } else if (rank === 2) {
    if (roll < 0.3) useIce = useCrates = true;
    else if (roll < 0.55) useIce = useChains = true;
    else if (roll < 0.8) useCrates = useChains = true;
    else useIce = true;
  } else {
    useIce = roll < 0.85;
    useCrates = roll > 0.25;
    useChains = roll < 0.4 || roll > 0.7;
  }

  const deepHp = rank >= 2;
  const crateMask = useCrates
    ? trimMask(shapeMask(rng, 0.3), rng, 6 + rank * 3, 4, true)
    : new Set<string>();
  const iceMask = useIce ? trimMask(shapeMask(rng, 0.45), rng, 12 + rank * 6) : new Set<string>();
  for (const k of crateMask) iceMask.delete(k);
  const chainMask = useChains
    ? trimMask(shapeMask(rng, 0.25), rng, 4 + rank * 2)
    : new Set<string>();
  for (const k of crateMask) chainMask.delete(k);

  // --- Board shape, honey and eggs ------------------------------------------
  // These arrive one at a time as the saga goes on. They draw from their own
  // random stream so the rest of the level does not depend on them.
  const extraRng = seededRng(id * 40503 + 977);
  const holeMask: Mask =
    chapter >= FIRST_CHAPTER.holes && extraRng() < 0.45
      ? maskOf(BOARD_SHAPES[Math.floor(extraRng() * BOARD_SHAPES.length)])
      : new Set();
  for (const k of holeMask) {
    crateMask.delete(k);
    iceMask.delete(k);
    chainMask.delete(k);
  }

  const honeyMask: Mask = new Set();
  if (chapter >= FIRST_CHAPTER.honey && rank >= 1 && extraRng() < 0.24) {
    // A blob that grows from a seed in the lower half of the board.
    const wanted = 3 + Math.floor(extraRng() * 3);
    let frontier = [{ row: 4 + Math.floor(extraRng() * 4), col: Math.floor(extraRng() * 8) }];
    for (let guard = 0; guard < 60 && honeyMask.size < wanted && frontier.length > 0; guard++) {
      const spot = frontier[Math.floor(extraRng() * frontier.length)];
      const k = key(spot.row, spot.col);
      if (spot.row < 3 || spot.row > 7 || spot.col < 0 || spot.col > 7 || holeMask.has(k) || crateMask.has(k)) {
        frontier = frontier.filter((f) => f !== spot);
        continue;
      }
      honeyMask.add(k);
      frontier.push(
        { row: spot.row, col: spot.col - 1 },
        { row: spot.row, col: spot.col + 1 },
        { row: spot.row - 1, col: spot.col },
        { row: spot.row + 1, col: spot.col }
      );
    }
    for (const k of honeyMask) {
      iceMask.delete(k);
      chainMask.delete(k);
    }
  }

  const eggCells: Array<{ row: number; col: number }> = [];
  // Eggs need room and time: never stack them on top of a heavy obstacle
  // board, or the level becomes a coin flip rather than a puzzle.
  const tooCrowded = iceMask.size > 20 || crateMask.size > 12;
  if (
    chapter >= FIRST_CHAPTER.eggs &&
    rank >= 1 &&
    honeyMask.size === 0 &&
    !tooCrowded &&
    extraRng() < 0.22
  ) {
    // Eggs start near the top, in columns with a clear way down.
    const freeCols = [0, 1, 2, 3, 4, 5, 6, 7].filter((col) => {
      for (let row = 0; row < 8; row++) {
        const k = key(row, col);
        if (holeMask.has(k) || crateMask.has(k) || chainMask.has(k)) return false;
      }
      return true;
    });
    for (let i = freeCols.length - 1; i > 0; i--) {
      const j = Math.floor(extraRng() * (i + 1));
      [freeCols[i], freeCols[j]] = [freeCols[j], freeCols[i]];
    }
    // At most three eggs, and only on the very hardest rank. Two is the norm:
    // every egg is pure gravity luck, not a match the player can plan.
    const wanted = Math.min(freeCols.length, rank >= 3 ? 3 : 2);
    for (const col of freeCols.slice(0, wanted)) {
      eggCells.push({ row: Math.floor(extraRng() * 2), col });
    }
    eggCells.sort((a, b) => a.col - b.col);
  }

  const holeCells = cellList(holeMask);
  const honeyCells = cellList(honeyMask);
  const crateCells = specsOf(crateMask, () => (deepHp && rng() < 0.4 ? 2 : 1));
  const iceCells = specsOf(iceMask, (r, c) => (deepHp && (r + c) % 3 === 0 ? 2 : 1));
  const chainCells = specsOf(chainMask, () => 1).map(({ row, col }) => ({ row, col }));

  const iceHp = iceCells.reduce((sum, c) => sum + c.hp, 0);
  const crateHp = crateCells.reduce((sum, c) => sum + c.hp, 0);

  // --- Move budget ---------------------------------------------------------
  // Moves a focused player needs for the obstacles alone. They overlap (one
  // blast often hits several kinds), so only the biggest counts in full.
  const boost = colorCount === 5 ? FIVE_ANIMAL_BOOST : 1;
  const obstacleCosts = [
    iceHp / (RATE.ice * boost),
    crateHp / (RATE.crateHp * boost),
    chainCells.length / (RATE.chain * boost),
    honeyCells.length / (RATE.honey * boost),
    eggCells.length / (RATE.egg * boost),
  ].filter((n) => n > 0);
  obstacleCosts.sort((a, b) => b - a);
  const obstacleCost = obstacleCosts.reduce((sum, n, i) => sum + n * (i === 0 ? 1 : 0.5), 0);

  const [lo, hi] = BASE_MOVES[difficulty];
  const share = EFFORT_SHARE[difficulty];
  let moves = lo + Math.floor(rng() * (hi - lo + 1));
  moves = Math.min(42, Math.max(moves, Math.ceil(obstacleCost / share)));
  const effort = moves * share;
  // Effort left for the "collect" style goal that runs alongside the obstacles.
  const spare = Math.max(effort * 0.45, effort - obstacleCost * 0.6);
  // A board with gaps has fewer matches to offer, honey fights back and eggs
  // depend on luck in their column: each gets a few moves of margin.
  moves += Math.round(holeCells.length / 4);
  if (honeyCells.length > 0) moves += 1;
  moves += eggCells.length * (rank === 0 ? 2 : 3);
  moves = Math.min(44, moves);

  // --- Objectives ----------------------------------------------------------
  const objectives: LevelConfig['objectives'] = [];
  // Honey and eggs always count as goals; other obstacles fill the remaining slots.
  if (honeyCells.length > 0) {
    objectives.push({ id: `g${id}-honey`, kind: 'honey', label: 'Honung', target: honeyCells.length });
  }
  if (eggCells.length > 0) {
    objectives.push({ id: `g${id}-egg`, kind: 'egg', label: 'Ägg', target: eggCells.length });
  }
  if (iceHp > 0) objectives.push({ id: `g${id}-ice`, kind: 'ice', label: 'Isrutor', target: iceHp });
  if (crateCells.length > 0 && objectives.length < 3) {
    objectives.push({ id: `g${id}-crate`, kind: 'crate', label: 'Trälådor', target: crateCells.length });
  }
  if (chainCells.length > 0 && objectives.length < 3) {
    objectives.push({ id: `g${id}-chain`, kind: 'chain', label: 'Kedjor', target: chainCells.length });
  }

  const extra = rng();
  if (objectives.length < 3) {
    if (extra < 0.12 && rank >= 1) {
      objectives.push({
        id: `g${id}-specials`,
        kind: 'specials',
        label: 'Specialare',
        target: Math.max(2, Math.round(spare * RATE.special * boost)),
      });
    } else if (extra < 0.2 && rank >= 1) {
      objectives.push({
        id: `g${id}-cascade`,
        kind: 'cascade3',
        label: 'Kaskad ×3+',
        target: Math.max(1, Math.round(spare * RATE.cascade3 * boost)),
      });
    } else if (extra < 0.32) {
      objectives.push({
        id: `g${id}-score`,
        kind: 'score',
        label: 'Poäng',
        target: Math.max(1500, Math.round((spare * RATE.score * boost) / 500) * 500),
      });
    } else {
      const wanted = objectives.length === 0 ? 2 : extra < 0.6 && objectives.length === 1 ? 2 : 1;
      const perMove = (wanted === 2 ? RATE.twoColors : RATE.oneColor) * boost;
      const start = Math.floor(rng() * colorCount);
      for (let i = 0; i < wanted && objectives.length < 3; i++) {
        const color = palette[(start + i * 2) % colorCount];
        objectives.push({
          id: `g${id}-${color}`,
          kind: 'color',
          color,
          label: ANIMAL_LABELS[color],
          target: Math.max(10, Math.round((spare * perMove) / 2) * 2),
        });
      }
    }
  }

  // --- Effort cap ----------------------------------------------------------
  // A level can pick up three goals that each need most of the move budget;
  // then it is lost by construction, not by play. Estimate what every goal
  // costs in moves and trim the elastic ones (collect/score) when the total
  // no longer fits. Obstacles are part of the board and are never reduced.
  const objectiveCost = (objective: LevelObjective): number => {
    switch (objective.kind) {
      case 'ice':
        return iceHp / RATE.ice;
      case 'crate':
        return crateHp / RATE.crateHp;
      case 'chain':
        return chainCells.length / RATE.chain;
      case 'honey':
        return honeyCells.length / RATE.honey;
      case 'egg':
        return eggCells.length / RATE.egg;
      case 'color':
        // A focused player collects roughly three requested animals per move.
        return objective.target / 3.0;
      case 'score':
        return objective.target / 900;
      case 'specials':
        return objective.target / RATE.special;
      case 'cascade3':
        return objective.target / RATE.cascade3;
      case 'boss':
        return objective.target / RATE.boss;
      default:
        return 0;
    }
  };

  const totalCost = objectives.reduce((sum, objective) => sum + objectiveCost(objective), 0);
  const budget = moves;
  if (rank >= 1 && totalCost > budget * 1.15) {
    const elastic = objectives.filter(
      (objective) => objective.kind === 'color' || objective.kind === 'score'
    );
    const fixedCost = totalCost - elastic.reduce((sum, objective) => sum + objectiveCost(objective), 0);
    const elasticCost = totalCost - fixedCost;
    if (elasticCost > 0) {
      const scale = Math.max(0.5, Math.max(0, budget - fixedCost) / elasticCost);
      for (const objective of elastic) {
        objective.target =
          objective.kind === 'score'
            ? Math.max(1500, Math.round((objective.target * scale) / 500) * 500)
            : Math.max(10, Math.round((objective.target * scale) / 2) * 2);
      }
    }
  }

  // The hint describes what the level actually asks for, obstacles first.
  const kinds = new Set(objectives.map((objective) => objective.kind));
  const subtitleKey: keyof typeof GENERATED_SUBTITLES =
    pos === LEVELS_PER_CHAPTER - 1
      ? 'finale'
      : objectives.length >= 3
      ? 'mixed'
      : kinds.has('egg')
      ? 'eggs'
      : kinds.has('honey')
      ? 'honey'
      : kinds.has('crate')
      ? 'crates'
      : kinds.has('chain')
      ? 'chains'
      : kinds.has('ice')
      ? 'ice'
      : kinds.has('color')
      ? 'collect'
      : kinds.has('specials')
      ? 'specials'
      : kinds.has('cascade3')
      ? 'cascades'
      : 'score';
  const subtitle = GENERATED_SUBTITLES[subtitleKey].text;

  const level: LevelConfig = {
    id,
    chapter,
    difficulty,
    name: getChapter(chapter).nameSv,
    subtitle,
    moves,
    colorCount,
    palette,
    objectives,
  };
  if (iceCells.length > 0) level.iceCells = iceCells;
  if (crateCells.length > 0) level.crateCells = crateCells;
  if (chainCells.length > 0) level.chainCells = chainCells;
  if (holeCells.length > 0) level.holeCells = holeCells;
  if (honeyCells.length > 0) level.honeyCells = honeyCells;
  if (eggCells.length > 0 && objectives.some((o) => o.kind === 'egg')) level.eggCells = eggCells;

  // --- Boss, bombs and conveyor belts ---------------------------------------
  // Own random stream again, so older levels keep their boards.
  const featRng = seededRng(id * 7919 + 31);
  if (pos === LEVELS_PER_CHAPTER - 1 && chapter >= FIRST_CHAPTER.boss) {
    // The chapter ends with a boss: every animal cleared hurts it, and it
    // fights back by chaining animals.
    const bossDef = BOSSES[biomeOfChapter(chapter)];
    level.boss = {
      every: rank >= 3 ? bossDef.every - 1 : bossDef.every,
      count: bossDef.count,
      attack: bossDef.attack,
      ...(bossDef.timer ? { timer: bossDef.timer } : {}),
    };
    // A boss that steals moves gets them added up front, so the level stays fair.
    if (bossDef.attack === 'steal') level.moves += Math.ceil(level.moves / level.boss.every);
    level.objectives = [
      {
        id: `g${id}-boss`,
        kind: 'boss',
        label: bossDef.nameSv,
        target: Math.round((moves * share * RATE.boss * boost) / 5) * 5,
      },
    ];
    level.subtitle = bossDef.introSv;
    delete level.eggCells;
    return level;
  }
  const feat = featRng();
  if (chapter >= FIRST_CHAPTER.bombs && feat < 0.22) {
    level.bombEvery = rank >= 2 ? 9 : 7;
    level.bombTimer = rank >= 2 ? 15 : 10;
    if (objectives.length <= 2 && !kinds.has('egg') && !kinds.has('honey')) {
      level.subtitle = GENERATED_SUBTITLES.bombs.text;
    }
  } else if (chapter >= FIRST_CHAPTER.belts && feat < 0.44) {
    const blocked = new Set<number>();
    for (const cells of [holeCells, honeyCells, crateCells]) for (const cell of cells) blocked.add(cell.row);
    const freeRows = [1, 2, 3, 4, 5, 6].filter((row) => !blocked.has(row));
    if (freeRows.length > 0) {
      const first = freeRows[Math.floor(featRng() * freeRows.length)];
      level.beltRows = [{ row: first, dir: featRng() < 0.5 ? 1 : -1 }];
      const others = freeRows.filter((row) => Math.abs(row - first) >= 2);
      if (others.length > 0 && featRng() < 0.5) {
        level.beltRows.push({
          row: others[Math.floor(featRng() * others.length)],
          dir: level.beltRows[0].dir === 1 ? -1 : 1,
        });
      }
    }
  } else if (chapter >= FIRST_CHAPTER.portals && feat < 0.6) {
    // Portals sit on plain open cells, well apart from each other.
    const taken = new Set<string>();
    for (const cells of [holeCells, honeyCells, crateCells, chainCells, eggCells]) {
      for (const cell of cells) taken.add(`${cell.row},${cell.col}`);
    }
    const spots: Coord[] = [];
    const wanted = featRng() < 0.5 ? 4 : 2;
    for (let tries = 0; tries < 80 && spots.length < wanted; tries++) {
      const spot = { row: 1 + Math.floor(featRng() * 6), col: Math.floor(featRng() * 8) };
      if (taken.has(`${spot.row},${spot.col}`)) continue;
      if (spots.some((s) => Math.abs(s.row - spot.row) + Math.abs(s.col - spot.col) < 3)) continue;
      spots.push(spot);
    }
    if (spots.length >= 2) {
      level.portalPairs = [[spots[0], spots[1]]];
      if (spots.length >= 4) level.portalPairs.push([spots[2], spots[3]]);
    }
  }
  return level;
}

const GENERATED_SUBTITLES = {
  finale: { text: 'Kapitlets final – allt på en gång' },
  mixed: { text: 'Blandade hinder – planera varje drag' },
  crates: { text: 'Spräck trälådorna genom att matcha intill dem' },
  chains: { text: 'Befria de kedjade djuren med matchningar' },
  ice: { text: 'Tina all is innan dragen tar slut' },
  collect: { text: 'Samla djuren innan dragen tar slut' },
  specials: { text: 'Skapa specialdjur med stora matchningar' },
  cascades: { text: 'Bygg långa kaskader för att nå målet' },
  score: { text: 'Jaga poäng – stora matchningar ger mest' },
  honey: { text: 'Rensa honungen – annars sprider den sig' },
  bombs: { text: 'Matcha bombdjuren innan nedräkningen når noll' },
  eggs: { text: 'Matcha under äggen så att de når botten' },
};

/** Chapter in which each newer ingredient first shows up. */
export const FIRST_CHAPTER = { boss: 5, holes: 6, honey: 9, eggs: 12, bombs: 15, belts: 18, portals: 21 };

function cellList(mask: Mask): Array<{ row: number; col: number }> {
  return Array.from(mask)
    .map((k) => k.split(',').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([row, col]) => ({ row, col }));
}

function mirrorLR(list: Array<[number, number]>): Array<{ row: number; col: number }> {
  const out: Array<{ row: number; col: number }> = [];
  for (const [row, col] of list) {
    out.push({ row, col });
    if (col !== 7 - col) out.push({ row, col: 7 - col });
  }
  return out;
}

/**
 * Gaps that give the board another outline. Every shape keeps all open cells
 * reachable for falling animals (straight down or diagonally past a gap).
 */
const BOARD_SHAPES: Array<Array<{ row: number; col: number }>> = [
  mirrorLR([[0, 0], [7, 0]]), // clipped corners
  mirrorLR([[0, 0], [0, 1], [1, 0]]), // rounded top
  mirrorLR([[7, 0], [7, 1], [6, 0]]), // rounded bottom
  mirrorLR([[0, 0], [0, 1], [1, 0], [7, 0], [7, 1], [6, 0]]), // octagon
  mirrorLR([[3, 3], [4, 3]]), // hole in the middle
  mirrorLR([[3, 0], [4, 0]]), // notched sides
  mirrorLR([[2, 2], [5, 2]]), // four pillars
  mirrorLR([[3, 1], [4, 1]]), // two posts
  mirrorLR([[0, 3]]), // gap in the top edge
  mirrorLR([[7, 3], [0, 0]]), // gap in the bottom edge
  mirrorLR([[2, 3], [5, 3]]), // two slots
  mirrorLR([[0, 0], [1, 0], [6, 0], [7, 0]]), // narrow waist reversed
];;

/** Objective labels for "collect this animal" goals. */
const ANIMAL_LABELS: Record<GemColor, string> = {
  ruby: 'Räv',
  amber: 'Lejon',
  emerald: 'Groda',
  cobalt: 'Pingvin',
  amethyst: 'Kanin',
  quartz: 'Isbjörn',
  tangerine: 'Tiger',
  lime: 'Sköldpadda',
  sky: 'Delfin',
  violet: 'Panda',
  rose: 'Uggla',
  mint: 'Säl',
};

const generatedCache = new Map<number, LevelConfig>();

/** Returns any campaign level by index (0-based); out-of-range indexes are clamped. */
export function getCampaignLevel(levelIdx: number): LevelConfig {
  const idx = Math.min(CAMPAIGN_LEVEL_COUNT - 1, Math.max(0, Math.floor(levelIdx) || 0));
  if (idx < CAMPAIGN_LEVELS.length) return CAMPAIGN_LEVELS[idx];
  let level = generatedCache.get(idx);
  if (!level) {
    level = generateLevel(idx);
    if (generatedCache.size > 400) generatedCache.clear();
    generatedCache.set(idx, level);
  }
  return level;
}
