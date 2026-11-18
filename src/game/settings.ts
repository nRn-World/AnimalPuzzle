import { detectLanguage, isLang, Lang, loadLanguage, setLanguage } from '../i18n';
import { readJson, readString, STORAGE_KEYS, writeJson } from './storage';

export interface Settings {
  /** Master switch for all audio. */
  muted: boolean;
  /** 0–1 */
  sfxVolume: number;
  /** 0–1 */
  musicVolume: number;
  haptics: boolean;
  /** Forces reduced motion. The OS-level preference is always honoured too. */
  reduceMotion: boolean;
  /** Draws a unique shape on every animal so colour is never the only cue. */
  symbols: boolean;
  /** Show a notification when the lives are full again. */
  reminders: boolean;
  language: Lang;
}

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  haptics: true,
  reduceMotion: false,
  symbols: false,
  reminders: false,
  language: 'sv',
};

function clamp01(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Turns anything read from storage into a complete, valid settings object. */
export function sanitizeSettings(raw: unknown, defaults: Settings = DEFAULT_SETTINGS): Settings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    muted: bool(src.muted, defaults.muted),
    sfxVolume: clamp01(src.sfxVolume, defaults.sfxVolume),
    musicVolume: clamp01(src.musicVolume, defaults.musicVolume),
    haptics: bool(src.haptics, defaults.haptics),
    reduceMotion: bool(src.reduceMotion, defaults.reduceMotion),
    symbols: bool(src.symbols, defaults.symbols),
    reminders: bool(src.reminders, defaults.reminders),
    language: isLang(src.language) ? src.language : defaults.language,
  };
}

function loadSettings(): Settings {
  const browserLanguages =
    typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : navigator.language
        ? [navigator.language]
        : undefined
      : undefined;
  const defaults: Settings = {
    ...DEFAULT_SETTINGS,
    // First launch: carry over the old stand-alone mute flag and follow the browser language.
    muted: readString(STORAGE_KEYS.legacyMuted) === '1',
    language: detectLanguage(browserLanguages),
  };
  return sanitizeSettings(readJson(STORAGE_KEYS.settings), defaults);
}

let current: Settings = loadSettings();
const listeners = new Set<() => void>();

function applyToDocument(settings: Settings): void {
  setLanguage(settings.language);
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = settings.language;
  if (settings.reduceMotion) root.dataset.reduceMotion = 'true';
  else delete root.dataset.reduceMotion;
}

applyToDocument(current);

/** Loads the dictionary of the saved language in the background. */
export function prepareLanguage(): Promise<boolean> {
  return loadLanguage(current.language);
}

/**
 * Tells the UI that the dictionary arrived, so text already on screen is
 * translated. The first paint must never wait for this: a slow or blocked
 * language chunk used to leave the whole game blank.
 */
export function notifyLanguageLoaded(): void {
  for (const listener of Array.from(listeners)) listener();
}

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = sanitizeSettings({ ...current, ...patch }, current);
  current = next;
  writeJson(STORAGE_KEYS.settings, next);
  applyToDocument(next);
  for (const listener of Array.from(listeners)) listener();
  return next;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True when either the player or the operating system asked for less motion. */
export function prefersReducedMotion(): boolean {
  if (current.reduceMotion) return true;
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}
