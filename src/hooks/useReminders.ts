import { useEffect } from 'react';
import { LivesState } from '../game/lives';
import { msToFullLives, remindersAllowed, showReminder } from '../game/reminders';
import { t } from '../i18n';

/**
 * While the game sits in the background, waits for the lives to fill up and
 * then shows a notification. Does nothing unless reminders are switched on
 * and the browser has granted permission.
 */
export function useReminders(enabled: boolean, lives: LivesState): void {
  useEffect(() => {
    if (!enabled) return;
    let timer: number | null = null;
    const clear = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };
    const onVisibility = () => {
      clear();
      if (document.visibilityState !== 'hidden' || !remindersAllowed()) return;
      const wait = msToFullLives(lives, Date.now());
      if (wait <= 0) return;
      timer = window.setTimeout(() => {
        void showReminder(t('Liven är fulla!'), t('Djuren väntar på dig – dags för en ny nivå.'));
      }, wait);
    };
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clear();
    };
  }, [enabled, lives]);
}
