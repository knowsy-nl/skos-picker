import { describe, it, expect } from 'vitest';
import {
  pickLangKey,
  resolveLabel,
  resolveLabelArray,
  isLangMap,
  payloadHasLangMaps,
  coerceValue,
  serializeValue,
  sortConcepts,
} from './resolve.js';

describe('pickLangKey', () => {
  const map = { en: 'English', nl: 'Dutch', 'en-GB': 'British' };

  it('returns null for an empty or non-map', () => {
    expect(pickLangKey({}, 'en')).toBe(null);
    expect(pickLangKey(null, 'en')).toBe(null);
  });

  it('matches an exact tag (case-insensitive)', () => {
    expect(pickLangKey(map, 'nl')).toBe('nl');
    expect(pickLangKey(map, 'EN-GB')).toBe('en-GB');
  });

  it('falls back from a subtag to the primary subtag', () => {
    expect(pickLangKey({ en: 'x', fr: 'y' }, 'en-US')).toBe('en');
  });

  it('falls back to any tag sharing the primary subtag', () => {
    expect(pickLangKey({ 'pt-BR': 'x' }, 'pt')).toBe('pt-BR');
  });

  it('uses langDefault before en/first', () => {
    expect(pickLangKey({ en: 'E', fr: 'F' }, 'de', 'fr')).toBe('fr');
  });

  it('prefers an untagged literal (@none or "") over en', () => {
    expect(pickLangKey({ en: 'E', '@none': 'N' }, 'de')).toBe('@none');
    expect(pickLangKey({ en: 'E', '': 'N' }, 'de')).toBe('');
  });

  it('falls back to en, then to the first key', () => {
    expect(pickLangKey({ en: 'E', fr: 'F' }, 'de')).toBe('en');
    expect(pickLangKey({ fr: 'F', es: 'S' }, 'de')).toBe('fr');
  });
});

describe('resolveLabel', () => {
  it('passes plain strings through unchanged', () => {
    expect(resolveLabel('Italian', 'nl')).toBe('Italian');
  });

  it('resolves a language map to the requested language', () => {
    expect(resolveLabel({ en: 'Italian', nl: 'Italiaans' }, 'nl')).toBe('Italiaans');
  });

  it('falls back to English when the requested language is missing', () => {
    expect(resolveLabel({ en: 'Japanese' }, 'de')).toBe('Japanese');
  });

  it('uses an untagged literal at any requested language', () => {
    expect(resolveLabel({ '@none': 'Fusion' }, 'de')).toBe('Fusion');
    expect(resolveLabel({ '@none': 'Fusion' }, 'en')).toBe('Fusion');
  });

  it('preserves null/undefined (e.g. an absent definition)', () => {
    expect(resolveLabel(null, 'en')).toBe(null);
    expect(resolveLabel(undefined, 'en')).toBe(undefined);
  });
});

describe('resolveLabelArray', () => {
  it('resolves mixed string + map entries and drops empties', () => {
    const arr = ['Plain', { en: 'Mediterranean', nl: 'Mediterraans' }, ''];
    expect(resolveLabelArray(arr, 'nl')).toEqual(['Plain', 'Mediterraans']);
  });

  it('returns [] for a non-array', () => {
    expect(resolveLabelArray(undefined, 'en')).toEqual([]);
  });
});

describe('isLangMap / payloadHasLangMaps', () => {
  it('isLangMap distinguishes maps from strings/arrays', () => {
    expect(isLangMap({ en: 'x' })).toBe(true);
    expect(isLangMap('x')).toBe(false);
    expect(isLangMap(['x'])).toBe(false);
    expect(isLangMap(null)).toBe(false);
  });

  it('detects a language map anywhere in the payload', () => {
    expect(payloadHasLangMaps({ label: 'L', concepts: [{ id: 'a', label: 'A' }] })).toBe(false);
    expect(payloadHasLangMaps({ label: { en: 'L' }, concepts: [] })).toBe(true);
    expect(
      payloadHasLangMaps({
        label: 'L',
        concepts: [{ id: 'a', label: 'A', altLabels: [{ en: 'x' }] }],
      })
    ).toBe(true);
  });

  it('handles a null payload', () => {
    expect(payloadHasLangMaps(null)).toBe(false);
  });
});

describe('coerceValue / serializeValue', () => {
  it('single-select keeps a string or null', () => {
    expect(coerceValue('Italian', false)).toBe('Italian');
    expect(coerceValue('', false)).toBe(null);
    expect(coerceValue(null, false)).toBe(null);
  });

  it('multi-select splits, trims, and drops empties', () => {
    expect(coerceValue('a, b ,,c', true)).toEqual(['a', 'b', 'c']);
    expect(coerceValue('', true)).toEqual([]);
    expect(coerceValue(null, true)).toEqual([]);
  });

  it('serialize round-trips both shapes', () => {
    expect(serializeValue(['a', 'b'])).toBe('a,b');
    expect(serializeValue('a')).toBe('a');
    expect(serializeValue(null)).toBe('');
  });
});

describe('sortConcepts', () => {
  const c = (id, label, group, isCatchall) => ({ id, label, group, isCatchall });

  it('alpha sorts by label', () => {
    const out = sortConcepts([c('1', 'Rust'), c('2', 'Go'), c('3', 'Java')], 'alpha');
    expect(out.map((x) => x.label)).toEqual(['Go', 'Java', 'Rust']);
  });

  it('group sorts by group then label, contiguous', () => {
    const out = sortConcepts(
      [
        c('1', 'Thai', 'Asia'),
        c('2', 'Italian', 'Europe'),
        c('3', 'Japanese', 'Asia'),
        c('4', 'French', 'Europe'),
      ],
      'group'
    );
    expect(out.map((x) => `${x.group}:${x.label}`)).toEqual([
      'Asia:Japanese',
      'Asia:Thai',
      'Europe:French',
      'Europe:Italian',
    ]);
  });

  it('natural keeps original (rawOrder) order', () => {
    const ids = ['z', 'a', 'm'];
    const out = sortConcepts([c('a', 'A'), c('m', 'M'), c('z', 'Z')], 'natural', ids);
    expect(out.map((x) => x.id)).toEqual(['z', 'a', 'm']);
  });

  it('always pushes catch-alls last regardless of mode', () => {
    const out = sortConcepts(
      [c('1', 'Other', null, true), c('2', 'Go'), c('3', 'Java')],
      'alpha'
    );
    expect(out.map((x) => x.label)).toEqual(['Go', 'Java', 'Other']);
  });
});
