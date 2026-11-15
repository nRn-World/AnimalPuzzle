import { useCallback, useEffect, useMemo, useState } from 'react';
import { soundEngine } from '../game/audio';
import {
  isDocumentFullscreen,
  isFullscreenSupported,
  toggleDocumentFullscreen,
} from '../game/fullscreen';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isDocumentFullscreen());
  const canFullscreen = useMemo(() => isFullscreenSupported(), []);

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
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  return { isFullscreen, canFullscreen, toggleFullscreen };
}
