/** Maximum vertical stretch on tall portrait screens so the board fills the screen cleanly. */
export const MAX_PORTRAIT_STRETCH = 1.28;

/** Subtle horizontal stretch on wide landscape screens so the board fills more of widescreen monitors. */
export const MAX_LANDSCAPE_STRETCH = 1.08;

export interface BoardDimensions {
  width: number;
  height: number;
}

/**
 * Computes the largest board rectangle that fits inside the available stage
 * while keeping cells well-proportioned on both portrait phones and wide
 * desktop / landscape screens.
 */
export function computeBoardDimensions(
  stageWidth: number,
  stageHeight: number
): BoardDimensions | null {
  const w = Math.floor(stageWidth);
  const h = Math.floor(stageHeight);
  if (w < 2 || h < 2) return null;

  if (h >= w) {
    const width = w;
    const height = Math.max(width, Math.min(h, Math.floor(width * MAX_PORTRAIT_STRETCH)));
    return { width, height };
  }

  const height = h;
  const width = Math.max(height, Math.min(w, Math.floor(height * MAX_LANDSCAPE_STRETCH)));
  return { width, height };
}
