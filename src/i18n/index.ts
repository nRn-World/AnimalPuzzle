import { en } from './en';

/**
 * Minimal gettext-style i18n. Swedish is the source language: the Swedish
 * text itself is the lookup key, so `t('Spela nu')` returns the string
 * unchanged in Swedish and the entry from `en.ts` in English. A test checks
 * that every string passed to `t()` (and every translatable data string) has
 * an English entry.
 */

export type Lang = 'sv' | 'en';

export const LANGUAGES: Array<{ id: Lang; label: string }> = [
  { id: 'sv', label: 'Svenska' },
  { id: 'en', label: 'English' },
];

const DICTIONARIES: Record<Lang, Record<string, string> | null> = {
  sv: null,
  en,
};

const NUMBER_LOCALES: Record<Lang, string> = {
  sv: 'sv-SE',
  en: 'en-US',
};

let currentLang: Lang = 'sv';

export function isLang(value: unknown): value is Lang {
  return value === 'sv' || value === 'en';
}

export function getLanguage(): Lang {
  return currentLang;
}

export function setLanguage(lang: Lang): void {
  currentLang = lang;
}

/** Picks a language from browser preferences; anything but Swedish gets English. */
export function detectLanguage(preferred: readonly string[] | undefined): Lang {
  for (const tag of preferred ?? []) {
    const base = tag.toLowerCase().split('-')[0];
    if (base === 'sv') return 'sv';
    if (base) return 'en';
  }
  return 'sv';
}

export type TParams = Record<string, string | number>;

export function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

/** Translates a Swedish source string and fills in `{name}` placeholders. */
export function t(source: string, params?: TParams): string {
  const dict = DICTIONARIES[currentLang];
  let template = (dict && dict[source]) || source;
  // Generated names ("Dimmiga dalen") have no entry of their own; they are
  // translated word by word when every word is known.
  if (dict && template === source && source.includes(' ')) {
    const words = source.split(' ');
    if (words.every((word) => dict[word])) template = words.map((word) => dict[word]).join(' ');
  }
  return interpolate(template, params);
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString(NUMBER_LOCALES[currentLang]);
}
