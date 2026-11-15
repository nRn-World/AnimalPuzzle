import { useSyncExternalStore } from 'react';
import { getSettings, Settings, subscribeSettings } from '../game/settings';

/** Re-renders the component whenever a setting (including language) changes. */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}
