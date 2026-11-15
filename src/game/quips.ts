/** Short lines the companion says during a level. */
export type QuipKind = 'cascade' | 'lowMoves' | 'powerReady';

export const QUIPS: Record<QuipKind, Array<{ saySv: string }>> = {
  cascade: [{ saySv: 'Vilken kedja!' }, { saySv: 'Mer, mer, mer!' }, { saySv: 'Såg du det där?' }],
  lowMoves: [{ saySv: 'Tänk efter nu...' }, { saySv: 'Få drag kvar!' }, { saySv: 'Vi fixar det här.' }],
  powerReady: [{ saySv: 'Jag är redo!' }, { saySv: 'Tryck på mig!' }, { saySv: 'Nu kör vi!' }],
};

/** Chain length from which the companion cheers. */
export const QUIP_CASCADE = 4;
/** Moves left at which the companion gets nervous. */
export const QUIP_LOW_MOVES = 3;

export function pickQuip(kind: QuipKind, rng: () => number = Math.random): string {
  const lines = QUIPS[kind];
  return lines[Math.min(lines.length - 1, Math.floor(rng() * lines.length))].saySv;
}
