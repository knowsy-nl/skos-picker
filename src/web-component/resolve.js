// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Jeroen Steggink, knowsy
//
// Pure, DOM-free helpers for label/language resolution, value coercion and
// sorting. Extracted from the custom element so they can be unit-tested
// directly (and reused). Nothing here touches `this`, the DOM, or the
// network — every input is a plain argument.

// ─── Language resolution ─────────────────────────────────────────────

/**
 * Pick the best language key from a label map { "en": "...", "nl": "..." }.
 *
 * SKOS allows plain (untagged) literals — no language tag at all. In a JSON
 * language map an untagged value is keyed by "@none" (JSON-LD convention) or
 * "" (empty string), and is treated as a language-neutral fallback.
 *
 * Order: exact tag → primary subtag (en-GB → en) → any tag sharing the
 * primary subtag → `langDefault` → untagged ("@none"/"") → "en" → first
 * available. Returns the matching key, or null for an empty map.
 *
 * @param {Record<string,string>} map
 * @param {string} lang     effective BCP-47 tag (e.g. "nl", "en-GB")
 * @param {string} [langDefault]  fallback tag when `lang` is absent
 * @returns {string|null}
 */
export function pickLangKey(map, lang, langDefault = '') {
  if (!map || typeof map !== 'object') return null;
  const keys = Object.keys(map);
  if (!keys.length) return null;
  const want = String(lang || '').toLowerCase();
  const base = want.split('-')[0];
  const byLower = (target) =>
    target ? keys.find((k) => k.toLowerCase() === target) : undefined;
  const untagged = keys.find((k) => k === '@none' || k === '');
  // NB: the untagged key can be "" (falsy), so step through with explicit
  // undefined checks rather than `||` (which would skip an empty-string key).
  const candidates = [
    byLower(want),
    byLower(base),
    keys.find((k) => k.toLowerCase().split('-')[0] === base),
    byLower(String(langDefault || '').toLowerCase()),
    untagged,
    byLower('en'),
    keys[0],
  ];
  return candidates.find((k) => k !== undefined) ?? null;
}

/**
 * Resolve a label that may be a plain string OR a language map to a string.
 * Strings (single-language / untagged literals) pass through unchanged.
 *
 * @param {string|Record<string,string>|null|undefined} label
 * @param {string} lang
 * @param {string} [langDefault]
 * @returns {string|null|undefined}
 */
export function resolveLabel(label, lang, langDefault = '') {
  if (label == null) return label;
  if (typeof label === 'string') return label;
  if (typeof label === 'object') {
    const key = pickLangKey(label, lang, langDefault);
    return key != null ? label[key] : '';
  }
  return String(label);
}

/**
 * Resolve an array whose entries may be strings or language maps, dropping
 * empties.
 *
 * @param {Array<string|Record<string,string>>|undefined} arr
 * @param {string} lang
 * @param {string} [langDefault]
 * @returns {string[]}
 */
export function resolveLabelArray(arr, lang, langDefault = '') {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => resolveLabel(x, lang, langDefault))
    .filter((s) => s != null && s !== '');
}

/** True if `v` is a language map (object, not array). */
export function isLangMap(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Does a raw data-source payload carry any language map? If so, a `lang`
 * change can be served from cache instead of re-fetching.
 *
 * @param {{label?:any, concepts?:Array<any>}} json
 * @returns {boolean}
 */
export function payloadHasLangMaps(json) {
  if (!json) return false;
  if (isLangMap(json.label)) return true;
  return (json.concepts || []).some(
    (c) =>
      isLangMap(c.label) ||
      isLangMap(c.definition) ||
      (Array.isArray(c.altLabels) && c.altLabels.some(isLangMap)) ||
      (Array.isArray(c.hiddenLabels) && c.hiddenLabels.some(isLangMap))
  );
}

// ─── Value coercion ──────────────────────────────────────────────────

/**
 * Coerce a `value` attribute string into the internal value shape.
 * Multi-select splits on commas; single-select keeps the string (or null).
 *
 * @param {string|null} attr
 * @param {boolean} multiple
 * @returns {string|string[]|null}
 */
export function coerceValue(attr, multiple) {
  if (multiple) {
    return attr ? attr.split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
  return attr || null;
}

/**
 * Serialize an internal value back to the string used for form submission.
 *
 * @param {string|string[]|null} value
 * @returns {string}
 */
export function serializeValue(value) {
  if (Array.isArray(value)) return value.join(',');
  return value || '';
}

// ─── Sorting ─────────────────────────────────────────────────────────

/**
 * Sort enriched concepts (catch-alls last) by the configured mode. Mutates
 * and returns the array. `rawOrder` supplies the original index for the
 * 'natural' mode (and for stable ordering when no mode applies).
 *
 * @template {{label:string, group?:string|null, isCatchall?:boolean, id:string}} T
 * @param {T[]} concepts
 * @param {'alpha'|'group'|'natural'|undefined} sort
 * @param {string[]} [rawOrder]  concept ids in their original order
 * @returns {T[]}
 */
export function sortConcepts(concepts, sort, rawOrder = []) {
  const idx = (c) => rawOrder.indexOf(c.id);
  return concepts.sort((a, b) => {
    if (!!a.isCatchall !== !!b.isCatchall) return a.isCatchall ? 1 : -1;
    if (sort === 'alpha') return a.label.localeCompare(b.label);
    if (sort === 'group') {
      const ga = a.group || '';
      const gb = b.group || '';
      if (ga !== gb) return ga.localeCompare(gb);
      return a.label.localeCompare(b.label);
    }
    return idx(a) - idx(b); // 'natural' / default
  });
}
