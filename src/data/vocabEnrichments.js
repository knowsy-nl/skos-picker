// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Jeroen Steggink, knowsy
//
// Per-scheme UX enrichments for the sample vocabularies in skosSchemes.js.
//
// The source data (skosSchemes.js) is intentionally flat — just ids and
// preferred labels. This file layers on the metadata the picker can render:
//   - sort:          'alpha' | 'natural' | 'group'
//   - notationOf     short code shown as a badge (e.g. "FP", "OOP")
//   - altLabelsOf    searchable AND displayed synonyms
//   - hiddenLabelsOf searchable but NEVER displayed (typos, variants, old names)
//   - definitionOf   inline scope note shown under the label
//   - groupOf        group header when sort='group'
//   - broaderOf      parent concept id (for the "⤷ parent" hint)
//   - relatedOf      cross-scheme links [{ schemeId, conceptId }]
//
// In production, all of this typically comes from your SKOS source
// (skos:altLabel, skos:definition, skos:broader, …) served via `data-source`.

import { schemesById } from './skosSchemes.js';

// Catch-all terms to de-emphasize and push to the bottom of the list.
const CATCHALL_RE = /^(other|n\.?a\.?|none|generic|unknown)$/i;

// ─── Programming-Language ──────────────────────────────────────────────
const LANG_INFO = {
  JavaScript: {
    notation: 'Multi',
    def: 'Dynamic language of the web; multi-paradigm.',
    alts: ['JS', 'ECMAScript'],
    hidden: ['node', 'nodejs', 'ecmascript'],
  },
  TypeScript: {
    notation: 'Multi',
    def: 'Typed superset of JavaScript that compiles to JS.',
    alts: ['TS'],
    hidden: ['typescript'],
  },
  Python: {
    notation: 'Multi',
    def: 'General-purpose language emphasising readability.',
    hidden: ['py', 'python3'],
  },
  Rust: {
    notation: 'Sys',
    def: 'Systems language focused on safety and performance.',
    hidden: ['rustlang'],
  },
  Go: {
    notation: 'Sys',
    def: 'Compiled language from Google; simple and concurrent.',
    alts: ['Golang'],
    hidden: ['golang'],
  },
  Java: { notation: 'OOP', def: 'Object-oriented language that runs on the JVM.' },
  CSharp: {
    notation: 'OOP',
    def: 'Object-oriented language on the .NET platform.',
    alts: ['C-Sharp', 'dotnet'],
    hidden: ['c#', 'csharp', 'c sharp'],
  },
  Haskell: { notation: 'FP', def: 'Purely functional, statically typed language.' },
};

// ─── Cuisine (grouped by region) ───────────────────────────────────────
const CUISINE_REGION = {
  Italian: 'Europe',
  French: 'Europe',
  Spanish: 'Europe',
  Japanese: 'Asia',
  Thai: 'Asia',
  Indian: 'Asia',
  Mexican: 'Americas',
  Ethiopian: 'Africa',
  Fusion: 'Other',
};
const CUISINE_HIDDEN = {
  Japanese: ['sushi', 'ramen'],
  Italian: ['pasta', 'pizza'],
  Thai: ['thailand'],
  Mexican: ['tex-mex', 'texmex'],
};

// ─── Music-Genre (grouped by family, with hierarchy) ───────────────────
const GENRE_INFO = {
  Jazz: { group: 'Acoustic', def: 'Improvisation-led genre rooted in blues and ragtime.' },
  Bebop: { group: 'Acoustic', def: 'Fast, complex jazz style from the 1940s.', broader: 'Jazz' },
  House: { group: 'Electronic', def: 'Four-on-the-floor dance music from Chicago.' },
  Techno: { group: 'Electronic', def: 'Repetitive, machine-driven electronic dance music.' },
  Rock: { group: 'Band', def: 'Guitar-driven popular music.' },
  Punk: { group: 'Band', def: 'Fast, raw, stripped-down rock.', broader: 'Rock' },
  HipHop: { group: 'Urban', def: 'Rhythmic vocal delivery over beats.', alts: ['Rap'] },
  Classical: { group: 'Acoustic', def: 'Western art music in the formal tradition.' },
};

// ─── Roast-Level (natural order, with notation) ────────────────────────
const ROAST_INFO = {
  Light: { notation: 'L1', def: 'Light brown, no oil on the surface, bright acidity.' },
  'Medium-Light': { notation: 'L2', def: 'Light brown, balanced, often called "City" roast.' },
  Medium: { notation: 'L3', def: 'Medium brown, fuller body, rounded acidity.' },
  'Medium-Dark': { notation: 'L4', def: 'Rich, dark brown with some oil; bittersweet.' },
  Dark: { notation: 'L5', def: 'Shiny, oily, smoky; low acidity.' },
};

// ─── Per-scheme configuration ──────────────────────────────────────────
export const schemeConfig = {
  'Programming-Language': {
    sort: 'alpha',
    notationOf: (c) => LANG_INFO[c.id]?.notation || null,
    altLabelsOf: (c) => LANG_INFO[c.id]?.alts || [],
    hiddenLabelsOf: (c) => LANG_INFO[c.id]?.hidden || [],
    definitionOf: (c) => LANG_INFO[c.id]?.def || null,
  },
  Cuisine: {
    sort: 'group',
    groupOf: (c) => CUISINE_REGION[c.id] || 'Other',
    hiddenLabelsOf: (c) => CUISINE_HIDDEN[c.id] || [],
  },
  'Music-Genre': {
    sort: 'group',
    groupOf: (c) => GENRE_INFO[c.id]?.group || 'Other',
    altLabelsOf: (c) => GENRE_INFO[c.id]?.alts || [],
    definitionOf: (c) => GENRE_INFO[c.id]?.def || null,
    broaderOf: (c) => GENRE_INFO[c.id]?.broader || null,
  },
  'Roast-Level': {
    sort: 'natural',
    notationOf: (c) => ROAST_INFO[c.id]?.notation || null,
    altLabelsOf: (c) => {
      const n = ROAST_INFO[c.id]?.notation;
      return n ? [n] : [];
    },
    definitionOf: (c) => ROAST_INFO[c.id]?.def || null,
  },
};

const defaultConfig = {
  sort: 'alpha',
  groupOf: () => null,
  notationOf: () => null,
  altLabelsOf: (c) => c.altLabels || [],
  hiddenLabelsOf: () => [],
  definitionOf: (c) => c.definition || null,
  broaderOf: () => null,
  relatedOf: () => [],
};

export function getSchemeConfig(schemeId) {
  return { ...defaultConfig, ...(schemeConfig[schemeId] || {}) };
}

// Returns enriched, sorted concepts ready for rendering.
export function getEnrichedConcepts(schemeId) {
  const scheme = schemesById[schemeId];
  if (!scheme) return [];
  const cfg = getSchemeConfig(schemeId);

  const enriched = scheme.concepts.map((c) => ({
    ...c,
    notation: cfg.notationOf?.(c) || null,
    altLabels: cfg.altLabelsOf?.(c) || [],
    hiddenLabels: cfg.hiddenLabelsOf?.(c) || [],
    definition: cfg.definitionOf?.(c) || null,
    group: cfg.groupOf?.(c) || null,
    broader: cfg.broaderOf?.(c) || null,
    related: cfg.relatedOf?.(c) || [],
    isCatchall: CATCHALL_RE.test(c.label) || CATCHALL_RE.test(c.id),
  }));

  // Sort: catch-alls always last, then by configured mode.
  const naturalIdx = (c) => scheme.concepts.findIndex((x) => x.id === c.id);
  const cmp = (a, b) => {
    if (a.isCatchall !== b.isCatchall) return a.isCatchall ? 1 : -1;
    if (cfg.sort === 'alpha') return a.label.localeCompare(b.label);
    if (cfg.sort === 'natural') return naturalIdx(a) - naturalIdx(b);
    if (cfg.sort === 'group') {
      const ga = a.group || '';
      const gb = b.group || '';
      if (ga !== gb) return ga.localeCompare(gb);
      return a.label.localeCompare(b.label);
    }
    return 0;
  };
  return enriched.sort(cmp);
}

export const isCatchall = (label, id) =>
  CATCHALL_RE.test(label || '') || CATCHALL_RE.test(id || '');
