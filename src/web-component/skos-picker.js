// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Jeroen Steggink, knowsy
// ─────────────────────────────────────────────────────────────────────
// <skos-picker> — vanilla custom element
//
// A framework-agnostic version of the SkosPicker. Drop a single <script>
// tag into any HTML page (including .cshtml / .razor / .aspx) and use it
// like a native form control:
//
//   <script src="skos-picker.js" type="module"></script>
//   <skos-picker
//     name="CuisineId"
//     scheme-id="Cuisine"
//     value="Italian"
//     placeholder="Pick a cuisine…">
//   </skos-picker>
//
// The element is form-associated: when placed inside a <form>, its `value`
// is submitted with the form data under the `name` attribute, exactly like
// an <input> or <select>. It also dispatches a `change` event whenever the
// selection changes.
//
// Features matched 1:1 with the React picker:
//   - main-name (prefLabel) match
//   - alternative names (altLabel) — searchable AND displayed
//   - hidden alternatives (hiddenLabel) — searchable, never displayed
//   - parent/child grouping where the scheme has it
//   - inline definitions / scope notes
//   - notation badges
//   - catch-all values pushed to the bottom and visually de-emphasised
//   - keyboard navigation (↑↓↵ esc)
//   - single OR multiple selection (multiple attribute)
//
// Configurable attributes (every visual touch can be turned off):
//   scheme-id          required — id of the controlled list
//   value              current value (string for single, comma-list for multi)
//   multiple           presence → multi-select with chips
//   placeholder        custom placeholder text
//   name               form field name (for form-data submission)
//   disabled           disable the control
//
//   min-chars          Minimum characters before the in-panel filter
//                      kicks in (default 0 — filter on every keystroke).
//                      Useful for long lists like Machine Type to avoid
//                      aggressive narrowing on a single letter.
//
//   lang               BCP-47 language tag (e.g. "en", "nl", "de", "en-GB")
//                      selecting which language to display. Optional — when
//                      omitted it defaults to the host page's <html lang> and
//                      finally to "en". The picker works fine with no language
//                      specified and with data that has no language at all.
//
//                      Two multilingual models are supported, and you can mix
//                      them freely:
//
//                      A) Server-resolved (one language at a time). When the
//                         labels in the data-source response are plain strings,
//                         the picker forwards the requested language to the
//                         endpoint — Accept-Language: <lang> header AND a
//                         ?lang=<lang> query param — and re-fetches when `lang`
//                         changes. The endpoint returns labels already in that
//                         language.
//
//                      B) Client-resolved (all languages at once). When a
//                         label is a language MAP instead of a string, e.g.
//                         { "en": "Italian", "nl": "Italiaans" }, the picker
//                         resolves the active language itself and switches
//                         language on a `lang` change WITHOUT re-fetching
//                         (the payload already holds every language).
//
//                      Language resolution order (per field):
//                        exact tag → primary subtag (en-GB → en) →
//                        `lang-default` attr → untagged literal → "en" →
//                        first available. SKOS plain (untagged) literals are
//                        represented in a map by the key "@none" or "" and are
//                        used as a language-neutral fallback.
//
//   lang-default       Optional BCP-47 fallback tag used when the requested
//                      language is missing from a language map (before the
//                      untagged / "en" / first-available fallbacks).
//
//   hide-footer        hide the dropdown footer (scheme code + key hints)
//   hide-scheme-code   hide just the cs:Scheme-Id code in the footer
//   hide-key-hints     hide just the "↑↓ navigate" hints in the footer
//   hide-notations     hide the small notation/code badges (e.g. L0, FSE)
//   hide-alt-labels    hide the "(alternative name)" helper text
//   hide-definitions   hide the inline definition / scope notes
//   hide-counter       hide the "5 of 17" counter in the panel header
//   hide-group-headers hide the group headers when sort=group
//
//   data-source        URL to fetch the dropdown values from. When set,
//                      the element fetches JSON from there instead of the
//                      bundled data tables. Expected JSON shape:
//                      { id, label, concepts: [{ id, label, altLabels?,
//                        hiddenLabels?, definition?, notation?, group? }] }
//
// Theming via CSS custom properties on :host or any ancestor:
//   --skos-picker-border          (default #ced4da)
//   --skos-picker-border-focus    (default #86b7fe)
//   --skos-picker-radius          (default 0.375rem)
//   --skos-picker-bg              (default #fff)
//   --skos-picker-active-bg       (default #e7f1ff)
//   --skos-picker-chip-bg         (default linear-gradient...)
//   --skos-picker-chip-fg         (default #084298)
//   --skos-picker-notation-bg     (default #e7f1ff)
//   --skos-picker-notation-fg     (default #084298)
//
// Data source:
//   - For the demo this file imports the same data tables the React app
//     uses, so the picker behaves identically inside or outside React.
//   - For production, override the data source via the `data-source`
//     attribute. The element fetches JSON from that URL on connect (and
//     whenever the URL or scheme-id changes) and caches it in memory.
//
// ─── data-source JSON contract ──────────────────────────────────────
// The endpoint returns a single concept scheme as JSON. The canonical
// identifier for both the scheme and each concept is its IRI — the same
// stable URL your SKOS source issues. Using IRIs (instead of bare slugs or
// integer ids) is what keeps selections joinable across systems.
//
// This shape is a flattened projection of SKOS (and SKOS-XL — see below):
//
//   {
//     "id":    "https://example.org/vocab/Cuisine",            // required, scheme IRI
//     "label": "Cuisine",                                      // required, panel header
//     "concepts": [                                            // required, may be empty
//       {
//         "id":           "https://example.org/vocab/Cuisine/Italian",
//         "label":        "Italian",                           // required, prefLabel
//         "altLabels":    ["Mediterranean"],                   // optional, shown + searchable
//         "hiddenLabels": ["italiano", "it"],                  // optional, searchable only
//         "definition":   "Cooking traditions of Italy.",      // optional, scope note
//         "notation":     null,                                // optional, short code badge
//         "group":        "Europe",                            // optional, group header
//         "broader":      null                                 // optional, parent concept id
//       }
//     ]
//   }
//
// Required fields: id, label, concepts; on each concept id, label.
// All other fields are optional — send what you have; the picker degrades
// gracefully when fields are missing.
//
// ── How this maps to SKOS / SKOS-XL ──────────────────────────────────
//   scheme.id        skos:ConceptScheme IRI
//   scheme.label     dct:title / rdfs:label of the scheme
//   concept.id       skos:Concept IRI
//   concept.label    skos:prefLabel        (SKOS-XL: skosxl:prefLabel → skosxl:literalForm)
//   concept.altLabels    skos:altLabel     (SKOS-XL: skosxl:altLabel  → skosxl:literalForm)
//   concept.hiddenLabels skos:hiddenLabel  (SKOS-XL: skosxl:hiddenLabel→ skosxl:literalForm)
//   concept.definition   skos:definition / skos:scopeNote
//   concept.notation     skos:notation
//   concept.group        skos:broader of a grouping concept, or skos:Collection membership
//   concept.broader      skos:broader (parent concept IRI)
//
// SKOS-XL note: the picker consumes plain *literal* labels, not the
// reified skosxl:Label resources. A SKOS-XL source resolves each
// skosxl:prefLabel/altLabel/hiddenLabel to its skosxl:literalForm and emits
// the string here. (If you also need to round-trip the Label IRIs, carry
// them in your own backend; the picker only needs the literal forms.)
// For language handling, resolve labels to the requested language
// server-side (the picker forwards the browser's Accept-Language; see below).
//
// The projection above is intentionally framework- and RDF-library-free so
// the element stays zero-dependency. Do the RDF→JSON projection wherever
// your taxonomy lives (a SPARQL CONSTRUCT, a build step, or an API layer).
//
// Form submission:
//   The value the picker submits under its `name` attribute is the full
//   IRI of the selected concept (or comma-separated IRIs for multi-select).
//
// Notes for the implementation team:
//   - Set `Cache-Control: public, max-age=3600` (or longer) if your lists
//     change rarely.
//   - For multi-language, rely on the standard `Accept-Language` header on
//     the request — the picker forwards the browser's preference.
//   - On error (HTTP 4xx/5xx or network failure) the element falls back to
//     the bundled data tables (demo mode). In production, log the error
//     server-side and return a sensible default.
//   - Common URL patterns: /api/vocab/{schemeId}, /api/taxonomy/schemes/{schemeId}.
//     The {schemeId} is the last segment of the scheme IRI.
// ─────────────────────────────────────────────────────────────────────

import { skosSchemes, schemesById } from '../data/skosSchemes.js';
import { getEnrichedConcepts, getSchemeConfig } from '../data/vocabEnrichments.js';
import {
  resolveLabel,
  resolveLabelArray,
  payloadHasLangMaps,
  coerceValue,
  serializeValue,
  sortConcepts,
} from './resolve.js';

// Expose data tables on the global so a host page can read them too —
// the .NET team often wants to debug from the browser console.
if (typeof window !== 'undefined') {
  window.SkosPickerData = window.SkosPickerData || { schemes: schemesById, list: skosSchemes };
}

// ─── Inline styles (no external dependencies) ────────────────────────

const STYLES = `
  :host {
    display: inline-block;
    width: 100%;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #212529;
    /* Theming hooks the host page can override */
    --skos-picker-border: #ced4da;
    --skos-picker-border-focus: #86b7fe;
    --skos-picker-radius: 0.375rem;
    --skos-picker-bg: #fff;
    --skos-picker-active-bg: #e7f1ff;
    --skos-picker-chip-bg: linear-gradient(135deg, #e7f1ff, #dbeafe);
    --skos-picker-chip-fg: #084298;
    --skos-picker-notation-bg: #e7f1ff;
    --skos-picker-notation-fg: #084298;
  }
  :host([disabled]) {
    pointer-events: none;
    opacity: 0.6;
  }
  .control {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    min-height: 38px;
    padding: 0.3rem 0.5rem;
    background: var(--skos-picker-bg);
    border: 1px solid var(--skos-picker-border);
    border-radius: var(--skos-picker-radius);
    cursor: text;
    transition: border-color .15s, box-shadow .15s;
  }
  .control:hover { border-color: #adb5bd; }
  :host(.open) .control,
  .control:focus-within {
    border-color: var(--skos-picker-border-focus);
    box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
    outline: 0;
  }
  .single-value {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4rem;
    flex: 1;
    padding: 0.1rem 0.25rem;
    min-width: 0;
  }
  .single-value .label-main { font-weight: 500; }
  .single-value .label-alts { font-size: 0.78rem; color: #6c757d; }
  .single-value .notation,
  .chip .notation,
  .option .notation {
    font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--skos-picker-notation-bg);
    color: var(--skos-picker-notation-fg);
    border: 1px solid #b6d4fe;
    border-radius: 4px;
    padding: 0 0.35rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--skos-picker-chip-bg);
    color: var(--skos-picker-chip-fg);
    border: 1px solid #b6d4fe;
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    font-size: 0.825rem;
    font-weight: 500;
  }
  /* Visibility hooks driven by host attributes */
  :host([hide-notations]) .notation { display: none !important; }
  :host([hide-alt-labels]) .label-alts { display: none !important; }
  :host([hide-definitions]) .label-definition { display: none !important; }
  :host([hide-counter]) .panel-counter { display: none !important; }
  :host([hide-group-headers]) .group-header { display: none !important; }
  :host([hide-footer]) .footer { display: none !important; }
  .chip-remove,
  .clear-btn {
    background: transparent;
    border: none;
    color: inherit;
    opacity: 0.6;
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    font-size: 0.95rem;
  }
  .chip-remove:hover,
  .clear-btn:hover { opacity: 1; }
  .input {
    flex: 1;
    min-width: 80px;
    border: none;
    outline: none;
    padding: 0.1rem 0.25rem;
    background: transparent;
    font: inherit;
  }
  .caret { color: #6c757d; pointer-events: none; }
  .panel {
    position: absolute;
    z-index: 1080;
    left: 0;
    right: 0;
    margin-top: 4px;
    max-height: 380px;
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    box-shadow: 0 12px 32px rgba(15,23,42,.18);
    overflow: hidden;
  }
  .panel-wrap { position: relative; }
  .panel-header {
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6c757d;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    display: flex; justify-content: space-between;
  }
  .options {
    overflow-y: auto;
    flex: 1;
    padding: 0.25rem 0;
  }
  .option {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    border-left: 3px solid transparent;
  }
  .option:hover, .option.active {
    background: #e7f1ff;
    border-left-color: #0d6efd;
  }
  .option.selected {
    background: #f0f9ff;
    font-weight: 500;
  }
  .option.catchall {
    opacity: 0.55;
    font-style: italic;
  }
  .option .check { width: 16px; color: #0d6efd; flex-shrink: 0; }
  .option .label-block { flex: 1; min-width: 0; }
  .option .label-line {
    display: flex; align-items: center;
    gap: 0.4rem; flex-wrap: wrap;
  }
  .option .label-alts {
    font-size: 0.78rem; color: #6c757d;
  }
  .option .label-definition {
    font-size: 0.74rem; color: #6c757d;
    margin-top: 0.15rem; line-height: 1.35;
  }
  .group-header {
    position: sticky; top: 0;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #495057;
    padding: 0.4rem 0.75rem;
    z-index: 1;
  }
  .empty {
    padding: 1rem 0.75rem;
    text-align: center;
    color: #6c757d;
    font-size: 0.85rem;
  }
  .footer {
    border-top: 1px solid #e9ecef;
    padding: 0.4rem 0.75rem;
    background: #f8f9fa;
    font-size: 0.72rem;
    color: #6c757d;
    display: flex; justify-content: space-between;
  }
  .footer code {
    background: #fff;
    padding: 0 0.25rem;
    border: 1px solid #dee2e6;
    border-radius: 3px;
  }
  mark {
    background: #fff3cd;
    padding: 0;
    border-radius: 2px;
  }
  /* Hidden by default */
  .panel-wrap { display: none; }
  :host(.open) .panel-wrap { display: block; }
`;

// ─── The custom element ───────────────────────────────────────────────

class SkosPickerElement extends HTMLElement {
  // Form-associated: lets the element participate in <form> like an <input>.
  static formAssociated = true;
  static observedAttributes = [
    'scheme-id',
    'value',
    'multiple',
    'placeholder',
    'disabled',
    'lang',
    'lang-default',
    'min-chars',
    'data-source',
    'hide-footer',
    'hide-scheme-code',
    'hide-key-hints',
    'hide-notations',
    'hide-alt-labels',
    'hide-definitions',
    'hide-counter',
    'hide-group-headers',
  ];

  constructor() {
    super();
    this._internals = this.attachInternals?.();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._open = false;
    this._query = '';
    this._activeIdx = 0;
    this._value = null; // string for single, array for multi
    this._enriched = [];
    this._render();
  }

  // ─── lifecycle ─────────────────────────────────────────────────────
  connectedCallback() {
    this._loadScheme().then(() => {
      this._initValueFromAttribute();
      this._update();
    });
    document.addEventListener('mousedown', this._onDocMouseDown);
  }

  disconnectedCallback() {
    document.removeEventListener('mousedown', this._onDocMouseDown);
  }

  attributeChangedCallback(name, _oldV, _newV) {
    if (!this.isConnected) return;
    if (name === 'lang' || name === 'lang-default') {
      // If the loaded payload already carries every language (label maps),
      // switch language client-side with no re-fetch. Otherwise the data is
      // single-language, so re-fetch and let the endpoint resolve labels to
      // the new language.
      if (this._payloadHasLangMaps()) {
        this._buildEnriched();
        this._update();
      } else {
        this._loadScheme().then(() => this._update());
      }
    } else if (name === 'scheme-id' || name === 'data-source') {
      this._loadScheme().then(() => this._update());
    } else if (name === 'value') {
      this._initValueFromAttribute();
      this._update();
    } else {
      // Visibility / placeholder / disabled all just need a re-render.
      this._update();
    }
  }

  // ─── Public API ────────────────────────────────────────────────────
  get value() {
    return this._value;
  }
  set value(v) {
    this._setValue(v, /*silent*/ true);
  }
  get multiple() {
    return this.hasAttribute('multiple');
  }

  // Effective language: explicit attribute wins, then inherited <html lang>,
  // then "en". Use BCP-47 tags like "en", "nl", "de", "en-GB".
  _effectiveLang() {
    return this.getAttribute('lang') || document.documentElement?.lang || 'en';
  }

  // Thin wrappers over the pure resolvers in ./resolve.js — they supply the
  // language config derived from this element's attributes/host. The actual
  // logic is unit-tested in resolve.test.js.
  _resolveLabel(label) {
    return resolveLabel(label, this._effectiveLang(), this.getAttribute('lang-default') || '');
  }

  _resolveLabelArray(arr) {
    return resolveLabelArray(arr, this._effectiveLang(), this.getAttribute('lang-default') || '');
  }

  // ─── internal helpers ──────────────────────────────────────────────
  async _loadScheme() {
    const id = this.getAttribute('scheme-id');
    const url = this.getAttribute('data-source');
    const lang = this._effectiveLang();

    // Optionally fetch from a remote endpoint (production .NET use case).
    // The picker forwards the language preference both as an HTTP header
    // AND as a query param — the endpoint can honour whichever is easier
    // to wire into its stack.
    if (url) {
      try {
        let fetchUrl;
        try {
          const u = new URL(url, document.baseURI);
          u.searchParams.set('lang', lang);
          fetchUrl = u.toString();
        } catch {
          // Fallback for exotic URLs the URL constructor can't parse
          fetchUrl = url + (url.includes('?') ? '&' : '?') + 'lang=' + encodeURIComponent(lang);
        }
        const res = await fetch(fetchUrl, {
          headers: { 'Accept-Language': lang },
        });
        const json = await res.json();
        // Expected shape: { id, label, concepts: [...] }. Labels may be
        // plain strings (single-language responses) OR language maps like
        // { "en": "...", "nl": "..." } (all-languages-at-once responses).
        this._raw = json; // keep the unresolved payload for live lang switches
        this._fromDataSource = true;
        this._config = getSchemeConfig(id);
        this._buildEnriched();
        return;
      } catch (err) {
        console.error('[skos-picker] failed to fetch data-source', url, err);
      }
    }

    // Otherwise fall back to the bundled data tables (demo mode).
    // The bundled data is single-language; the `lang` attribute has no
    // effect in demo mode.
    this._raw = schemesById[id] || null;
    this._fromDataSource = false;
    this._config = getSchemeConfig(id);
    if (this._raw) {
      // Bundled data already carries enrichment logic; use it as-is.
      this._scheme = this._raw;
      this._enriched = id ? getEnrichedConcepts(id) : [];
    } else {
      this._scheme = null;
      this._enriched = [];
    }
  }

  // Resolve the raw data-source payload to the active language and shape it
  // for rendering. Re-runnable on `lang` change without re-fetching, since
  // language-map payloads already carry every language.
  _buildEnriched() {
    const json = this._raw;
    if (!json) {
      this._scheme = null;
      this._enriched = [];
      return;
    }
    this._scheme = { ...json, label: this._resolveLabel(json.label) };
    const rawConcepts = json.concepts || [];
    const enriched = rawConcepts.map((c) => ({
      ...c,
      label: this._resolveLabel(c.label),
      altLabels: this._resolveLabelArray(c.altLabels),
      hiddenLabels: this._resolveLabelArray(c.hiddenLabels),
      definition: this._resolveLabel(c.definition) || null,
      group: this._resolveLabel(c.group) || null,
      isCatchall: false,
    }));

    // Sort to match the bundled getEnrichedConcepts(): by configured mode,
    // so grouped schemes render contiguous group headers regardless of the
    // order the endpoint returned concepts in. "natural" keeps payload order.
    this._enriched = sortConcepts(
      enriched,
      this._config?.sort,
      rawConcepts.map((c) => c.id)
    );
  }

  // True when the loaded payload carries more than one language (any field
  // is a language map), so a `lang` change can be served from cache.
  _payloadHasLangMaps() {
    return payloadHasLangMaps(this._raw);
  }

  _initValueFromAttribute() {
    this._value = coerceValue(this.getAttribute('value'), this.multiple);
    this._syncFormValue();
  }

  _syncFormValue() {
    if (!this._internals) return;
    // The web platform has no simple native multi-value form control, so a
    // multi-select submits a comma-separated string (split it server-side).
    this._internals.setFormValue(serializeValue(this._value));
  }

  _setValue(v, silent) {
    this._value = v;
    this._syncFormValue();
    if (!silent) {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: v },
          bubbles: true,
          composed: true,
        })
      );
    }
    this._update();
  }

  _toggle(conceptId) {
    if (this.multiple) {
      const arr = Array.isArray(this._value) ? this._value : [];
      const next = arr.includes(conceptId)
        ? arr.filter((x) => x !== conceptId)
        : [...arr, conceptId];
      this._setValue(next);
    } else {
      this._setValue(conceptId === this._value ? null : conceptId);
      this._setOpen(false);
      this._query = '';
    }
  }

  _remove(conceptId) {
    if (this.multiple) {
      this._setValue(
        (Array.isArray(this._value) ? this._value : []).filter((x) => x !== conceptId)
      );
    } else {
      this._setValue(null);
    }
  }

  _setOpen(open) {
    this._open = open;
    if (open) {
      this.classList.add('open');
      // Position the active option on the current selection when opening
      // without a search query. Avoids the "open-and-you're-on-item-0"
      // surprise when the user already picked a value earlier.
      if (!this._query) {
        const ids = this._selectedIds();
        if (ids.length > 0) {
          const filtered = this._filtered();
          const idx = filtered.findIndex((c) => c.id === ids[0]);
          this._activeIdx = idx >= 0 ? idx : 0;
        } else {
          this._activeIdx = 0;
        }
      } else {
        this._activeIdx = 0;
      }
    } else {
      this.classList.remove('open');
    }
    this._update();
    // After the DOM has the new panel layout, scroll the active option
    // into view so the selected value is visible, not just highlighted.
    if (open) {
      requestAnimationFrame(() => this._scrollActiveIntoView());
    }
  }

  _scrollActiveIntoView() {
    if (!this._refs?.options) return;
    const active = this._refs.options.querySelector('.option.active');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  _onDocMouseDown = (e) => {
    if (!this._open) return;
    if (!this.contains(e.target) && !this._shadow.contains(e.composedPath?.()[0])) {
      this._setOpen(false);
      this._query = '';
      this._update();
    }
  };

  _minChars() {
    const v = parseInt(this.getAttribute('min-chars') || '0', 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  }

  _filtered() {
    const q = this._query.trim().toLowerCase();
    const min = this._minChars();
    if (!q || q.length < min) return this._enriched;
    return this._enriched.filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true;
      if (c.altLabels?.some((a) => a.toLowerCase().includes(q))) return true;
      if (c.hiddenLabels?.some((h) => h.toLowerCase().includes(q))) return true;
      if (c.notation?.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  _selectedIds() {
    if (this.multiple) return Array.isArray(this._value) ? this._value : [];
    return this._value ? [this._value] : [];
  }

  _selectedConcepts() {
    const ids = this._selectedIds();
    return ids.map((id) => this._enriched.find((c) => c.id === id)).filter(Boolean);
  }

  // ─── render ────────────────────────────────────────────────────────
  _render() {
    this._shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="control" part="control">
        <div class="chips-area"></div>
        <input class="input" part="input" />
        <button type="button" class="clear-btn" hidden aria-label="Clear">×</button>
        <span class="caret" aria-hidden="true">▾</span>
      </div>
      <div class="panel-wrap">
        <div class="panel" part="panel">
          <div class="panel-header">
            <span class="panel-title"></span>
            <span class="panel-counter"></span>
          </div>
          <div class="options"></div>
          <div class="footer">
            <span class="footer-scheme"><code class="scheme-code"></code></span>
            <span class="footer-hints">↑↓ navigate · ↵ select · esc close</span>
          </div>
        </div>
      </div>
    `;

    // refs
    this._refs = {
      control: this._shadow.querySelector('.control'),
      chipsArea: this._shadow.querySelector('.chips-area'),
      input: this._shadow.querySelector('.input'),
      clearBtn: this._shadow.querySelector('.clear-btn'),
      panelTitle: this._shadow.querySelector('.panel-title'),
      panelCounter: this._shadow.querySelector('.panel-counter'),
      options: this._shadow.querySelector('.options'),
      footerScheme: this._shadow.querySelector('.footer-scheme'),
      footerHints: this._shadow.querySelector('.footer-hints'),
      schemeCode: this._shadow.querySelector('.scheme-code'),
    };

    // events
    this._refs.control.addEventListener('click', () => {
      this._setOpen(true);
      this._refs.input.focus();
    });
    this._refs.input.addEventListener('input', (e) => {
      this._query = e.target.value;
      this._activeIdx = 0;
      this._setOpen(true);
      this._update();
    });
    this._refs.input.addEventListener('keydown', (e) => this._onKey(e));
    this._refs.clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._setValue(this.multiple ? [] : null);
    });
  }

  _onKey(e) {
    const filtered = this._filtered();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._activeIdx = Math.min(filtered.length - 1, this._activeIdx + 1);
      this._update();
      this._scrollActiveIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._activeIdx = Math.max(0, this._activeIdx - 1);
      this._update();
      this._scrollActiveIntoView();
    } else if (e.key === 'Enter' && filtered[this._activeIdx]) {
      e.preventDefault();
      this._toggle(filtered[this._activeIdx].id);
    } else if (e.key === 'Backspace' && !this._query) {
      const sel = this._selectedConcepts();
      if (sel.length) {
        e.preventDefault();
        this._remove(sel[sel.length - 1].id);
      }
    } else if (e.key === 'Escape') {
      this._setOpen(false);
      this._query = '';
      this._update();
    }
  }

  _update() {
    if (!this._refs) return;
    const r = this._refs;
    const single = !this.multiple;
    const selected = this._selectedConcepts();
    const filtered = this._filtered();

    // Scheme code in footer
    r.schemeCode.textContent = this._scheme ? `cs:${this._scheme.id}` : '(no scheme)';

    // Granular footer / header visibility
    r.footerScheme.style.display = this.hasAttribute('hide-scheme-code') ? 'none' : '';
    r.footerHints.style.display = this.hasAttribute('hide-key-hints') ? 'none' : '';

    // Chips area
    r.chipsArea.innerHTML = '';
    if (single && selected[0] && !this._open) {
      const c = selected[0];
      const span = document.createElement('span');
      span.className = 'single-value';
      span.title = c.definition || c.uri || '';
      span.innerHTML =
        (c.notation ? `<span class="notation">${c.notation}</span>` : '') +
        `<span class="label-main">${escapeHtml(c.label)}</span>` +
        (c.altLabels?.length
          ? `<span class="label-alts">(${escapeHtml(c.altLabels.join(' / '))})</span>`
          : '');
      r.chipsArea.appendChild(span);
    } else if (!single) {
      for (const c of selected) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.title = c.definition || c.uri || '';
        chip.innerHTML =
          (c.notation ? `<span class="notation">${c.notation}</span>` : '') +
          escapeHtml(c.label) +
          ` <button type="button" class="chip-remove" aria-label="Remove">×</button>`;
        chip.querySelector('.chip-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          this._remove(c.id);
        });
        r.chipsArea.appendChild(chip);
      }
    }

    // Input visibility & placeholder
    const placeholder =
      this.getAttribute('placeholder') ||
      (single
        ? `Select ${this._scheme?.label || 'value'}…`
        : `Tag with ${this._scheme?.label || 'values'}…`);
    if (single && selected[0] && !this._open) {
      r.input.style.display = 'none';
    } else {
      r.input.style.display = '';
      r.input.value = this._query;
      r.input.placeholder = selected.length && !single ? '' : placeholder;
    }

    // Clear button
    r.clearBtn.hidden = !(single && selected[0] && !this._open);

    // Header
    r.panelTitle.textContent = this._scheme?.label || '';
    r.panelCounter.textContent = `${filtered.length} of ${this._scheme?.concepts?.length || 0}`;

    // Options
    r.options.innerHTML = '';
    const min = this._minChars();
    const q = this._query.trim();
    const belowMin = min > 0 && q.length > 0 && q.length < min;
    if (belowMin) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = `Type at least ${min} characters to filter.`;
      r.options.appendChild(empty);
      return;
    }
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = `No values match “${this._query}”`;
      r.options.appendChild(empty);
      return;
    }

    // Render with optional grouping
    let lastGroup = null;
    let conceptIdx = 0;
    filtered.forEach((c) => {
      if (this._config.sort === 'group' && c.group !== lastGroup) {
        const h = document.createElement('div');
        h.className = 'group-header';
        h.textContent = c.group || 'Other';
        r.options.appendChild(h);
        lastGroup = c.group;
      }
      const opt = document.createElement('div');
      opt.className =
        'option' +
        (this._selectedIds().includes(c.id) ? ' selected' : '') +
        (conceptIdx === this._activeIdx ? ' active' : '') +
        (c.isCatchall ? ' catchall' : '');
      opt.innerHTML = `
        <span class="check">${this._selectedIds().includes(c.id) ? '✓' : ''}</span>
        <div class="label-block">
          <div class="label-line">
            ${c.notation ? `<span class="notation">${c.notation}</span>` : ''}
            <span class="label-text">${this._highlight(c.label)}</span>
            ${
              c.altLabels?.length
                ? `<span class="label-alts">(${escapeHtml(c.altLabels.join(' / '))})</span>`
                : ''
            }
          </div>
          ${c.definition ? `<div class="label-definition">${escapeHtml(c.definition)}</div>` : ''}
        </div>
      `;
      const idx = conceptIdx;
      opt.addEventListener('mouseenter', () => {
        this._activeIdx = idx;
        this._update();
      });
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._toggle(c.id);
      });
      r.options.appendChild(opt);
      conceptIdx++;
    });
  }

  _highlight(label) {
    if (!this._query) return escapeHtml(label);
    const i = label.toLowerCase().indexOf(this._query.toLowerCase());
    if (i < 0) return escapeHtml(label);
    return (
      escapeHtml(label.slice(0, i)) +
      `<mark>${escapeHtml(label.slice(i, i + this._query.length))}</mark>` +
      escapeHtml(label.slice(i + this._query.length))
    );
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Register the element
if (!customElements.get('skos-picker')) {
  customElements.define('skos-picker', SkosPickerElement);
}

export { SkosPickerElement };
