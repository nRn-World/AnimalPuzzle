import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { en } from './en';
import { detectLanguage, formatNumber, interpolate, setLanguage, t } from './index';

const SRC_DIR = join(import.meta.dirname, '..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(name) && !/\.test\.ts$/.test(name) && name !== 'en.ts') out.push(full);
  }
  return out;
}

function unescape(literal: string): string {
  return literal.replace(/\\(['"\\])/g, '$1');
}

/**
 * Swedish source strings found in the code:
 *  - every literal passed to t('...')
 *  - every literal assigned to a property that holds display text in the game
 *    data (level names, objective labels, achievement texts, guide pages ...),
 *    which is translated later when it is rendered.
 */
function collectSourceStrings(): Map<string, string> {
  const found = new Map<string, string>();
  const patterns = [
    /\bt\(\s*'((?:[^'\\\n]|\\.)*)'/g,
    /\bt\(\s*"((?:[^"\\\n]|\\.)*)"/g,
    /\b(?:name|subtitle|label|title|sub|eyebrow|text|tip|nameSv|descSv|titleSv|labelSv|powerSv|attackSv|introSv|captionSv|saySv|instructionSv|goalSummary|beam_h|beam_v|nova|scout|prism)\s*:\s*'((?:[^'\\\n]|\\.)*)'/g,
  ];
  for (const file of sourceFiles(SRC_DIR)) {
    const code = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      for (const match of code.matchAll(pattern)) {
        const value = unescape(match[1]);
        if (value) found.set(value, file.slice(SRC_DIR.length + 1));
      }
    }
  }
  // Return strings from pure helpers that are translated by their callers.
  for (const cheer of ['OTROLIGT!', 'MAGISKT!', 'SUPER!', 'KASKAD!']) {
    found.set(cheer, 'game/scoring.ts');
  }
  return found;
}

// Identifiers and proper nouns that are legitimately the same in both languages.
const SAME_IN_BOTH = new Set(['Nova', 'SUPERNOVA', 'Svenska', 'English']);

function placeholders(text: string): string[] {
  return Array.from(text.matchAll(/\{(\w+)\}/g), (m) => m[1]).sort();
}

test('every Swedish source string has an English translation', () => {
  const sources = collectSourceStrings();
  assert.ok(sources.size > 150, `suspiciously few strings found: ${sources.size}`);
  const missing: string[] = [];
  for (const [text, file] of sources) {
    // Non-text literals caught by the property pattern (ids, css classes, etc.).
    if (!/[A-Za-zÅÄÖåäö]/.test(text)) continue;
    if (!(text in en)) missing.push(`${file}: ${JSON.stringify(text)}`);
  }
  assert.deepEqual(missing, []);
});

test('translations keep exactly the placeholders of their source', () => {
  for (const [source, translation] of Object.entries(en)) {
    assert.deepEqual(
      placeholders(translation),
      placeholders(source),
      `placeholder mismatch for ${JSON.stringify(source)}`
    );
    assert.ok(translation.trim().length > 0, `empty translation for ${JSON.stringify(source)}`);
  }
});

test('the dictionary has no leftovers that the code no longer uses', () => {
  const sources = collectSourceStrings();
  const unused = Object.keys(en).filter((key) => !sources.has(key));
  assert.deepEqual(unused, []);
});

test('translations actually differ from the Swedish source', () => {
  const untranslated = Object.entries(en)
    .filter(([source, translation]) => source === translation && !SAME_IN_BOTH.has(source))
    // Pure symbols/numbers and brand names carry no language.
    .filter(([source]) => /[åäöÅÄÖ]/.test(source))
    .map(([source]) => source);
  assert.deepEqual(untranslated, []);
});

test('t() falls back to the source text and fills in placeholders', () => {
  setLanguage('sv');
  assert.equal(t('Nivå {n} · {name}', { n: 3, name: 'Rimfrost' }), 'Nivå 3 · Rimfrost');
  setLanguage('en');
  try {
    assert.equal(t('Spela nu'), 'Play now');
    assert.equal(t('Nivå {n} · {name}', { n: 3, name: 'Rimfrost' }), 'Level 3 · Rimfrost');
    assert.equal(t('En sträng som inte finns'), 'En sträng som inte finns');
    assert.equal(formatNumber(12400), '12,400');
  } finally {
    setLanguage('sv');
  }
  assert.equal(interpolate('{a} and {missing}', { a: 1 }), '1 and {missing}');
});

test('language detection prefers Swedish only for Swedish browsers', () => {
  assert.equal(detectLanguage(['sv-SE', 'en']), 'sv');
  assert.equal(detectLanguage(['en-GB', 'sv']), 'en');
  assert.equal(detectLanguage(['de']), 'en');
  assert.equal(detectLanguage([]), 'sv');
  assert.equal(detectLanguage(undefined), 'sv');
});
