import { useCallback, useEffect, useState } from 'react';

/** The non-standard event Chromium fires when the page can be installed. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let pending: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  // Registered at module load: the event often fires before the menu mounts.
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pending = event as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    pending = null;
    listeners.forEach((fn) => fn());
  });
}

/**
 * `canInstall` is true when the browser offers installation (Chrome, Edge,
 * Android). Safari on iPhone has no such event: there the user adds the game
 * from the share menu.
 */
export function useInstallPrompt(): { canInstall: boolean; install: () => void } {
  const [canInstall, setCanInstall] = useState(pending !== null);

  useEffect(() => {
    const update = () => setCanInstall(pending !== null);
    listeners.add(update);
    update();
    return () => void listeners.delete(update);
  }, []);

  const install = useCallback(() => {
    const event = pending;
    if (!event) return;
    pending = null;
    setCanInstall(false);
    event.prompt().catch(() => {});
  }, []);

  return { canInstall, install };
}
