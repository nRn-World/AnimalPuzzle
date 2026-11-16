import { useLayoutEffect, useRef, useState } from 'react';
import { computeBoardDimensions } from '../game/boardLayout';

/**
 * Fits the board to its stage so it fills all free space left by the HUD
 * across mobile portrait, mobile landscape, tablets and widescreen desktop.
 */
export function useBoardSize(active: boolean) {
  const boardStageRef = useRef<HTMLDivElement | null>(null);
  const [boardSide, setBoardSide] = useState<number>(480);
  const [boardHeight, setBoardHeight] = useState<number>(480);

  useLayoutEffect(() => {
    if (!active) return;
    const stage = boardStageRef.current;
    if (!stage) return;

    let rafId = 0;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      const dims = computeBoardDimensions(rect.width, rect.height);
      if (!dims) return;
      setBoardSide((prev) => (prev === dims.width ? prev : dims.width));
      setBoardHeight((prev) => (prev === dims.height ? prev : dims.height));
    };

    const scheduleMeasure = () => {
      measure();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    document.addEventListener('fullscreenchange', scheduleMeasure);
    document.addEventListener('webkitfullscreenchange', scheduleMeasure);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', scheduleMeasure);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      document.removeEventListener('fullscreenchange', scheduleMeasure);
      document.removeEventListener('webkitfullscreenchange', scheduleMeasure);
      vv?.removeEventListener('resize', scheduleMeasure);
    };
  }, [active]);

  return { boardStageRef, boardSide, boardHeight };
}
