/**
 * The story: short comic pages. The first one is shown when the game is
 * opened for the first time, the others when a new landscape is reached.
 */
import { BIOMES, BiomeId, CHAPTERS_PER_BIOME } from './biomes';

const BIOME_ORDER = BIOMES.map((biome) => biome.id);
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { GemColor } from './types';

export interface StoryPanel {
  biome: BiomeId;
  /** Animals standing in the panel, left to right. */
  cast: GemColor[];
  /** Narration box at the top of the panel. */
  captionSv: string;
  /** Speech bubble, said by the first animal. */
  saySv?: string;
  boss?: boolean;
}

export interface StoryPage {
  id: string;
  titleSv: string;
  panels: StoryPanel[];
}

export const STORY_PAGES: StoryPage[] = [
  {
    id: 'intro',
    titleSv: 'Stormen',
    panels: [
      {
        biome: 'skargard',
        cast: ['ruby', 'amber', 'emerald'],
        captionSv: 'En natt slet stormen loss djurens ö och spred vännerna över hela världen.',
        saySv: 'Var är alla?',
      },
      {
        biome: 'skargard',
        cast: ['ruby', 'cobalt'],
        captionSv: 'Räven bestämde sig: varenda vän ska hittas, och ön ska byggas upp igen.',
        saySv: 'Vi seglar i gryningen!',
      },
      {
        biome: 'skargard',
        cast: ['amethyst'],
        captionSv: 'Men Kapten Krake vaktar skärgården och släpper inte förbi någon utan strid.',
        saySv: 'Hjälp oss samla flocken!',
        boss: true,
      },
    ],
  },
  {
    id: 'ang',
    titleSv: 'Sommarängen',
    panels: [
      {
        biome: 'ang',
        cast: ['emerald', 'amethyst'],
        captionSv: 'Bortom skärgården breder en äng ut sig, full av blommor och surrande vingar.',
        saySv: 'Här luktar det honung!',
      },
      {
        biome: 'ang',
        cast: ['ruby'],
        captionSv: 'Getingdrottningen har tagit ängen i besittning, och hon gillar inte besök.',
        saySv: 'Akta bomberna!',
        boss: true,
      },
    ],
  },
  {
    id: 'oken',
    titleSv: 'Öknen',
    panels: [
      {
        biome: 'oken',
        cast: ['tangerine', 'amber'],
        captionSv: 'Solen bränner och sanden tar aldrig slut. Tigern visar vägen mellan dynerna.',
        saySv: 'Följ mina spår!',
      },
      {
        biome: 'oken',
        cast: ['lime'],
        captionSv: 'Under sanden rör sig något stort. Sandormen begraver allt som står still.',
        saySv: 'Jag går så fort jag kan...',
        boss: true,
      },
    ],
  },
  {
    id: 'vinter',
    titleSv: 'Vinterlandet',
    panels: [
      {
        biome: 'vinter',
        cast: ['quartz', 'cobalt'],
        captionSv: 'Snön knarrar under tassarna. Isbjörnen och pingvinen känner sig äntligen hemma.',
        saySv: 'Lagom varmt, tycker jag.',
      },
      {
        biome: 'vinter',
        cast: ['mint'],
        captionSv: 'Högst upp på glaciären sover Isdraken. Den som väcker den fryser fast.',
        saySv: 'Tyst nu, allihop!',
        boss: true,
      },
    ],
  },
  {
    id: 'rymden',
    titleSv: 'Rymden',
    panels: [
      {
        biome: 'rymden',
        cast: ['rose', 'violet'],
        captionSv: 'Ugglan hittade en raket bakom isen. Nästa vän finns visst bland stjärnorna.',
        saySv: 'Tre, två, ett...',
      },
      {
        biome: 'rymden',
        cast: ['sky'],
        captionSv: 'Kapten Blip samlar på allt som blänker, och allra helst på andras drag.',
        saySv: 'Han tog mitt drag!',
        boss: true,
      },
    ],
  },
  {
    id: 'vulkan',
    titleSv: 'Vulkanen',
    panels: [
      {
        biome: 'vulkan',
        cast: ['amber', 'ruby', 'tangerine'],
        captionSv: 'Den sista vännen sitter fast vid vulkanens fot, där marken glöder röd.',
        saySv: 'Nu vänder vi inte om.',
      },
      {
        biome: 'vulkan',
        cast: ['violet'],
        captionSv: 'Lavadraken vaktar vägen hem. Bakom den väntar havet, och ön som ska byggas upp.',
        saySv: 'Tillsammans klarar vi det!',
        boss: true,
      },
    ],
  },
  {
    id: 'hem',
    titleSv: 'Hemma igen',
    panels: [
      {
        biome: 'skargard',
        cast: ['ruby', 'amber', 'emerald', 'cobalt'],
        captionSv: 'Flocken är samlad och seglar hem. Men världen är stor, och äventyret går ett varv till.',
        saySv: 'En gång till?',
      },
    ],
  },
];

/**
 * Pages the player has earned, in order: the intro, then one per landscape
 * reached during the first trip around the world, then the homecoming.
 */
export function pagesReached(highestChapter: number): string[] {
  const ids = ['intro'];
  const biomesReached = Math.floor((Math.max(1, highestChapter) - 1) / CHAPTERS_PER_BIOME);
  for (let i = 1; i < BIOME_ORDER.length && i <= biomesReached; i++) ids.push(BIOME_ORDER[i]);
  if (biomesReached >= BIOME_ORDER.length) ids.push('hem');
  return ids;
}

/** The first earned page that has not been read yet. */
export function nextUnseenPage(highestChapter: number, seen: string[]): StoryPage | null {
  const id = pagesReached(highestChapter).find((page) => !seen.includes(page));
  return STORY_PAGES.find((page) => page.id === id) ?? null;
}

export function sanitizeSeen(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(STORY_PAGES.map((page) => page.id));
  return raw.filter((id): id is string => typeof id === 'string' && known.has(id));
}

export function readSeenPages(): string[] {
  return sanitizeSeen(readJson(STORAGE_KEYS.story));
}

export function writeSeenPages(seen: string[]): void {
  writeJson(STORAGE_KEYS.story, seen);
}

// --- After a boss ---------------------------------------------------------------

/** Two short scenes per landscape; they alternate from chapter to chapter. */
const BOSS_SCENES: Record<BiomeId, Array<{ cast: GemColor[]; captionSv: string; saySv: string }>> = {
  skargard: [
    { cast: ['ruby', 'cobalt'], captionSv: 'Kapten Krake sjönk muttrande tillbaka i djupet, och farleden låg öppen.', saySv: 'Hissa segel!' },
    { cast: ['amber', 'emerald'], captionSv: 'Kraken tappade sin hatt i vågorna. Lejonet bär den nu med stolthet.', saySv: 'Den klär mig!' },
  ],
  ang: [
    { cast: ['amethyst', 'emerald'], captionSv: 'Getingdrottningen surrade iväg över klövern, och ängen blev stilla igen.', saySv: 'Äntligen picknick!' },
    { cast: ['ruby', 'amethyst'], captionSv: 'Bina tackade för hjälpen med en burk av sin bästa honung.', saySv: 'Dela lika nu!' },
  ],
  oken: [
    { cast: ['tangerine', 'lime'], captionSv: 'Sandormen grävde ner sig djupt, och en oas glittrade fram bakom dynen.', saySv: 'Vatten!' },
    { cast: ['lime', 'amber'], captionSv: 'Sköldpaddan kom fram sist av alla, men hade hela tiden rätt om vägen.', saySv: 'Det var ju det jag sa.' },
  ],
  vinter: [
    { cast: ['quartz', 'mint'], captionSv: 'Isdraken gäspade, vände sig om och somnade på nytt. Passet var fritt.', saySv: 'Smyg, smyg...' },
    { cast: ['cobalt', 'quartz'], captionSv: 'Pingvinen åkte kana hela vägen ner från glaciären, till allas förtjusning.', saySv: 'En gång till!' },
  ],
  rymden: [
    { cast: ['rose', 'sky'], captionSv: 'Kapten Blip lämnade tillbaka varenda drag och blev bjuden på te i raketen.', saySv: 'Socker i?' },
    { cast: ['violet', 'rose'], captionSv: 'Pandan hittade en ny stjärnbild som ser precis ut som en bambu.', saySv: 'Den är min.' },
  ],
  vulkan: [
    { cast: ['amber', 'tangerine'], captionSv: 'Lavadraken blåste en sista rökring och släppte fram flocken.', saySv: 'Vi klarade det!' },
    { cast: ['ruby', 'violet'], captionSv: 'Marken svalnade under tassarna, och långt borta syntes havet.', saySv: 'Hem, hallå!' },
  ],
};

/** The page shown the first time the boss of a chapter is beaten. */
export function bossPage(chapter: number, biome: BiomeId, bossNameSv: string): StoryPage {
  const scenes = BOSS_SCENES[biome];
  const scene = scenes[Math.abs(chapter) % scenes.length];
  return {
    id: `boss-${chapter}`,
    titleSv: bossNameSv,
    panels: [{ biome, cast: scene.cast, captionSv: scene.captionSv, saySv: scene.saySv }],
  };
}
