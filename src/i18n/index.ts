
/**
 * Minimal gettext-style i18n. Swedish is the source language: the Swedish
 * text itself is the lookup key, so `t('Spela nu')` returns the string
 * unchanged in Swedish and the entry from `en.ts` in English. A test checks
 * that every string passed to `t()` (and every translatable data string) has
 * an entry in every dictionary.
 */

export type Lang = 'sv' | 'en' | 'de' | 'es' | 'fr' | 'tr';

export const LANGUAGES: Array<{ id: Lang; label: string }> = [
  { id: 'sv', label: 'Svenska' },
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'tr', label: 'Türkçe' },
];

type Dictionary = Record<string, string>;

/** Swedish needs none; every other language is a file of its own, loaded on demand. */
const DICTIONARIES: Partial<Record<Lang, Dictionary | null>> = {
  sv: null,
};

const LOADERS: Partial<Record<Lang, () => Promise<Dictionary>>> = {
  en: () => import('./en').then((m) => m.en),
  de: () => import('./de').then((m) => m.de),
  es: () => import('./es').then((m) => m.es),
  fr: () => import('./fr').then((m) => m.fr),
  tr: () => import('./tr').then((m) => m.tr),
};

/**
 * Fetches the dictionary of a language that is not bundled with the first
 * load. Until it has arrived `t()` answers in Swedish. Resolves to false if
 * the download failed (for example offline before the file was cached).
 */
export async function loadLanguage(lang: Lang): Promise<boolean> {
  if (lang in DICTIONARIES) return true;
  const loader = LOADERS[lang];
  if (!loader) return false;
  try {
    DICTIONARIES[lang] = await loader();
    return true;
  } catch {
    return false;
  }
}

const NUMBER_LOCALES: Record<Lang, string> = {
  sv: 'sv-SE',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  tr: 'tr-TR',
};

let currentLang: Lang = 'sv';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && LANGUAGES.some((lang) => lang.id === value);
}

export function getLanguage(): Lang {
  return currentLang;
}

export function setLanguage(lang: Lang): void {
  currentLang = lang;
}

/** Picks a language from browser preferences; an unknown language gets English. */
export function detectLanguage(preferred: readonly string[] | undefined): Lang {
  for (const tag of preferred ?? []) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
    if (base) return 'en';
  }
  return 'sv';
}

const GENDERS = 'mfn';

/** Strips the grammar hints from a chapter-name word that is shown on its own. */
function plain(value: string): string {
  return value.replace(/^[mfn]:/, '').replace(/^>/, '').split('|')[0];
}

/**
 * Builds a generated chapter name ("Dimmiga dalen") from its two words. The
 * place may carry a gender tag ("f:Vallée") and the adjective one form per
 * gender ("Brumeux|Brumeuse"); a leading ">" puts the adjective last.
 */
function composeName(adjectiveEntry: string, placeEntry: string): string {
  const tagged = /^([mfn]):(.*)$/.exec(placeEntry);
  const place = tagged ? tagged[2] : placeEntry;
  const after = adjectiveEntry.startsWith('>');
  const forms = (after ? adjectiveEntry.slice(1) : adjectiveEntry).split('|');
  const adjective = forms[tagged ? Math.min(GENDERS.indexOf(tagged[1]), forms.length - 1) : 0];
  return after ? `${place} ${adjective}` : `${adjective} ${place}`;
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
  const dict = DICTIONARIES[currentLang] ?? null;
  const entry = dict ? dict[source] : undefined;
  let template = entry ? plain(entry) : source;
  // Generated names ("Dimmiga dalen") have no entry of their own; they are
  // translated word by word when every word is known.
  if (dict && !entry && source.includes(' ')) {
    const words = source.split(' ');
    if (words.length === 2 && dict[words[0]] && dict[words[1]]) {
      template = composeName(dict[words[0]], dict[words[1]]);
    } else if (words.every((word) => dict[word])) {
      template = words.map((word) => plain(dict[word])).join(' ');
    }
  }
  return interpolate(template, params);
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString(NUMBER_LOCALES[currentLang]);
}
