import { useCallback, useEffect, useMemo, useState } from 'react';
import { soundEngine } from '../game/audio';
import {
  enterDocumentFullscreen,
  exitDocumentFullscreen,
  isDocumentFullscreen,
  isFullscreenSupported,
  toggleDocumentFullscreen,
} from '../game/fullscreen';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isDocumentFullscreen());
  const canFullscreen = useMemo(() => isFullscreenSupported(), []);

  const enterFullscreen = useCallback(() => {
    if (!canFullscreen || isDocumentFullscreen()) return;
    void enterDocumentFullscreen().then((next) => {
      setIsFullscreen(next);
    });
  }, [canFullscreen]);

  const exitFullscreen = useCallback(() => {
    if (!isDocumentFullscreen()) return;
    void exitDocumentFullscreen().then((next) => {
      setIsFullscreen(next);
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    soundEngine.playClick();
    void toggleDocumentFullscreen().then((next) => {
      setIsFullscreen(next);
    });
  }, []);

  useEffect(() => {
    const sync = () => setIsFullscreen(isDocumentFullscreen());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    document.addEventListener('fullscreenerror', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      document.removeEventListener('fullscreenerror', sync);
    };
  }, []);

  return { isFullscreen, canFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
