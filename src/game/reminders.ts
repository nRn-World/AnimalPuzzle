/**
 * Reminders: a system notification when the lives are full again. There is
 * no push server, so a reminder can only be sent while the game is still
 * open in the background (a tab or an installed app that has not been closed).
 */
import { LIFE_REGEN_MS, LivesState, MAX_LIVES, msToNextLife } from './lives';

export function remindersSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function remindersAllowed(): boolean {
  return remindersSupported() && Notification.permission === 'granted';
}

/** Asks for permission to show notifications. Resolves to true when granted. */
export async function requestReminders(): Promise<boolean> {
  if (!remindersSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/** Milliseconds until every life is back; 0 when they already are. */
export function msToFullLives(state: LivesState, now: number): number {
  if (state.lives >= MAX_LIVES) return 0;
  return msToNextLife(state, now) + (MAX_LIVES - state.lives - 1) * LIFE_REGEN_MS;
}

export async function showReminder(title: string, body: string): Promise<void> {
  if (!remindersAllowed()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const options = { body, tag: 'animalpuzzle-reminder', icon: 'icon-192.png', badge: 'icon-192.png' };
    if (registration) await registration.showNotification(title, options);
    else new Notification(title, options);
  } catch {
    // Notifications are a nicety; never let them break the game.
  }
}
