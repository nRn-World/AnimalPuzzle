/** The saga travels through a new landscape every ten chapters. */
export type BiomeId = 'skargard' | 'ang' | 'oken' | 'vinter' | 'rymden' | 'vulkan';

export const CHAPTERS_PER_BIOME = 10;

export const BIOMES: ReadonlyArray<{ id: BiomeId; nameSv: string }> = [
  { id: 'skargard', nameSv: 'Skärgården' },
  { id: 'ang', nameSv: 'Sommarängen' },
  { id: 'oken', nameSv: 'Öknen' },
  { id: 'vinter', nameSv: 'Vinterlandet' },
  { id: 'rymden', nameSv: 'Rymden' },
  { id: 'vulkan', nameSv: 'Vulkanen' },
];

export function biomeOfChapter(chapterId: number): BiomeId {
  const safe = Number.isFinite(chapterId) ? Math.max(1, Math.floor(chapterId)) : 1;
  return BIOMES[Math.floor((safe - 1) / CHAPTERS_PER_BIOME) % BIOMES.length].id;
}

export function biomeName(id: BiomeId): string {
  return BIOMES.find((b) => b.id === id)!.nameSv;
}
