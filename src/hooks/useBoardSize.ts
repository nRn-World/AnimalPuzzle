import { useEffect, useRef, useState } from 'react';

/** How much taller than wide the board may get on a tall (portrait) screen. */
const MAX_PORTRAIT_STRETCH = 1.25;

/**
 * Fits the board to its stage: it always fills the free space left by the
 * HUD. On tall phone screens the cells are allowed to grow a little taller
 * than wide so the board covers more of the screen.
 */
export function useBoardSize(active: boolean) {
  const boardStageRef = useRef<HTMLDivElement | null>(null);
  const [boardSide, setBoardSide] = useState<number>(480);
  const [boardHeight, setBoardHeight] = useState<number>(480);

  useEffect(() => {
    if (!active) return;
    const stage = boardStageRef.current;
    if (!stage) return;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      // Reserve room for the active-tool hint line above the pedestal.
      const free = rect.height - 26;
      const side = Math.max(220, Math.floor(Math.min(rect.width, free)));
      setBoardSide(side);
      setBoardHeight(Math.max(side, Math.floor(Math.min(free, side * MAX_PORTRAIT_STRETCH))));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener('orientationchange', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, [active]);

  return { boardStageRef, boardSide, boardHeight };
}
