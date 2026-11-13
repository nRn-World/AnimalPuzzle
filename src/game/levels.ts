import { GemColor, LevelConfig, LevelDifficulty } from './types';

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
    moves: 24,
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
    moves: 24,
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
    moves: 25,
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
    moves: 26,
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
    moves: 28,
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
    moves: 24,
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
    moves: 24,
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
    moves: 26,
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
    moves: 26,
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
    moves: 28,
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
    moves: 28,
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
    moves: 30,
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
    moves: 30,
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
    moves: 30,
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
    moves: 32,
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
    moves: 34,
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
