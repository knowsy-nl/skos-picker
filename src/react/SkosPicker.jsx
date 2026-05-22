import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, ChevronDown, Check, Sparkles, Tag, Info } from 'lucide-react';
import { schemesById } from '../data/skosSchemes.js';
import { getEnrichedConcepts, getSchemeConfig } from '../data/vocabEnrichments.js';

/**
 * Modern replacement for a Bootstrap <select> bound to a SKOS scheme.
 *
 * Reads enrichment metadata from vocabEnrichments.js to:
 *  - sort alphabetically (or by hierarchy / natural order)
 *  - group concepts under family headers (e.g. Europe, Asia for Cuisine)
 *  - show notation codes (e.g. L1..L5) as small badges
 *  - render abbreviation expansions as altLabels you can search by
 *  - inline definitions / scope notes
 *  - de-emphasize catch-all values (Other, N.A., None) and push to bottom
 *
 * Props:
 *   schemeId    - id of the scheme in skosSchemes (e.g. "Cuisine")
 *   value       - selected concept id (single) or array (multi)
 *   onChange    - (newValue) => void
 *   multiple    - allow multiple selections (defaults to false)
 *   placeholder - input placeholder text
 *   contextText - free-text used to compute "smart" suggestions
 */
export default function SkosPicker({
  schemeId,
  value,
  onChange,
  multiple = false,
  placeholder,
  contextText = '',
  // Minimum characters before the live filter kicks in. Default 0 keeps
  // the existing behaviour (filter on every keystroke) — useful for long
  // lists like Machine Type to avoid aggressive narrowing on a single
  // letter.
  minChars = 0,
}) {
  const scheme = schemesById[schemeId];
  const config = getSchemeConfig(schemeId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const enriched = useMemo(
    () => (scheme ? getEnrichedConcepts(schemeId) : []),
    [schemeId, scheme]
  );
  const enrichedById = useMemo(
    () => Object.fromEntries(enriched.map((c) => [c.id, c])),
    [enriched]
  );

  const selectedIds = useMemo(() => {
    if (multiple) return Array.isArray(value) ? value : [];
    return value ? [value] : [];
  }, [value, multiple]);

  const selectedConcepts = selectedIds
    .map((id) => enrichedById[id])
    .filter(Boolean);

  // Smart suggestions: rank by token overlap with contextText, including altLabels
  const suggestions = useMemo(() => {
    if (!contextText || contextText.length < 3) return [];
    const tokens = contextText
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3);
    if (!tokens.length) return [];
    const scored = enriched
      .filter((c) => !selectedIds.includes(c.id) && !c.isCatchall)
      .map((c) => {
        const lab = c.label.toLowerCase();
        const alts = (c.altLabels || []).map((a) => a.toLowerCase());
        let score = 0;
        for (const t of tokens) {
          if (lab === t) score += 5;
          else if (lab.startsWith(t)) score += 3;
          else if (lab.includes(t)) score += 2;
          else if (
            lab.split(/\s+/).some((w) => w.startsWith(t) || t.startsWith(w))
          )
            score += 1;
          for (const a of alts) {
            if (a === t) score += 4;
            else if (a.includes(t)) score += 2;
          }
        }
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.c);
    return scored;
  }, [contextText, enriched, selectedIds]);

  // Filtered list — match prefLabel, altLabels, notation, AND hiddenLabels
  // (hiddenLabels make search forgiving — typos, variants, old names — but
  // are never displayed in the UI). Below `minChars` characters the
  // filter is treated as empty so the user sees the full list.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < minChars) return enriched;
    return enriched.filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true;
      if (c.altLabels?.some((a) => a.toLowerCase().includes(q))) return true;
      if (c.hiddenLabels?.some((h) => h.toLowerCase().includes(q))) return true;
      if (c.notation?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, enriched, minChars]);

  const belowMinChars =
    minChars > 0 && query.trim().length > 0 && query.trim().length < minChars;

  // Group filtered list by enrichment.group (when sort='group')
  const grouped = useMemo(() => {
    if (config.sort !== 'group') return null;
    const map = new Map();
    for (const c of filtered) {
      const g = c.group || 'Other';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(c);
    }
    return Array.from(map.entries()); // [[groupName, concepts[]], ...]
  }, [filtered, config.sort]);

  // Build a flat array of "rendered" items (group headers + concepts) for keyboard nav
  const flatItems = useMemo(() => {
    if (!grouped) return filtered.map((c) => ({ kind: 'concept', concept: c }));
    const items = [];
    for (const [g, list] of grouped) {
      items.push({ kind: 'header', label: g });
      for (const c of list) items.push({ kind: 'concept', concept: c });
    }
    return items;
  }, [grouped, filtered]);

  // index of selectable items only (concepts)
  const conceptItemIndices = useMemo(
    () =>
      flatItems
        .map((item, idx) => (item.kind === 'concept' ? idx : -1))
        .filter((i) => i >= 0),
    [flatItems]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // When the panel opens (or the query changes), decide which option should
  // be the active one. If the user already has a selection and hasn't typed
  // anything, start keyboard navigation on that selection — not on the first
  // item in the list.
  useEffect(() => {
    if (!open) {
      setActiveIdx(0);
      return;
    }
    if (!query && selectedIds.length > 0) {
      const idx = filtered.findIndex((c) => c.id === selectedIds[0]);
      setActiveIdx(idx >= 0 ? idx : 0);
    } else {
      setActiveIdx(0);
    }
    // Deliberately exclude selectedIds/filtered from deps — we only want
    // this to run on open/query transitions, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  // Scroll the active option into view whenever it changes while the
  // panel is open. Works for both "just opened" (positioning on the
  // selection) and arrow-key navigation.
  useEffect(() => {
    if (!open) return;
    const el = wrapRef.current?.querySelector('.skos-picker-option.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [open, activeIdx]);

  const toggle = useCallback(
    (conceptId) => {
      if (multiple) {
        const arr = Array.isArray(value) ? value : [];
        const next = arr.includes(conceptId)
          ? arr.filter((x) => x !== conceptId)
          : [...arr, conceptId];
        onChange(next);
      } else {
        onChange(conceptId === value ? null : conceptId);
        setOpen(false);
        setQuery('');
      }
    },
    [multiple, value, onChange]
  );

  const remove = useCallback(
    (conceptId) => {
      if (multiple) {
        onChange((Array.isArray(value) ? value : []).filter((x) => x !== conceptId));
      } else {
        onChange(null);
      }
    },
    [multiple, value, onChange]
  );

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(conceptItemIndices.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const idx = conceptItemIndices[activeIdx];
      const item = flatItems[idx];
      if (item?.kind === 'concept') {
        e.preventDefault();
        toggle(item.concept.id);
      }
    } else if (e.key === 'Backspace' && !query && selectedConcepts.length) {
      e.preventDefault();
      remove(selectedConcepts[selectedConcepts.length - 1].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const highlight = (label) => {
    if (!query) return label;
    const idx = label.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return label;
    return (
      <>
        {label.slice(0, idx)}
        <mark className="skos-match">{label.slice(idx, idx + query.length)}</mark>
        {label.slice(idx + query.length)}
      </>
    );
  };

  // Now we can early-return for unknown schemes — all hooks above have run.
  if (!scheme) {
    return (
      <div className="alert alert-warning py-1 px-2 mb-0">
        Unknown SKOS scheme: <code>{schemeId}</code>
      </div>
    );
  }

  // Single-value vs multi-value rendering of the control
  const single = !multiple;
  const singleSelected = single && selectedConcepts[0];

  return (
    <div
      ref={wrapRef}
      className={`skos-picker ${open ? 'open' : ''} ${
        single ? 'skos-picker-single' : 'skos-picker-multi'
      }`}
    >
      <div
        className="skos-picker-control"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Multi-value: render chips */}
        {!single &&
          selectedConcepts.map((c) => (
            <span key={c.id} className="skos-chip" title={c.definition || c.uri}>
              {c.notation && <span className="chip-notation">{c.notation}</span>}
              {c.label}
              <button
                type="button"
                className="chip-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(c.id);
                }}
                aria-label={`Remove ${c.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}

        {/* Single-value display when not actively typing */}
        {single && singleSelected && !open && (
          <span
            className="skos-picker-single-value"
            title={singleSelected.definition || singleSelected.uri}
          >
            {singleSelected.notation && (
              <span className="value-notation">{singleSelected.notation}</span>
            )}
            <span className="value-label">{singleSelected.label}</span>
            {singleSelected.altLabels?.length > 0 && (
              <span className="value-alts">
                ({singleSelected.altLabels.join(' / ')})
              </span>
            )}
          </span>
        )}

        {/* Search input — always for multi; for single only when open or empty */}
        {(!single || open || !singleSelected) && (
          <input
            ref={inputRef}
            type="text"
            className="skos-picker-input"
            value={query}
            placeholder={
              single && singleSelected
                ? ''
                : placeholder ||
                  (single
                    ? `Select ${scheme.label}…`
                    : `Tag with ${scheme.label}…`)
            }
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
          />
        )}

        {/* Clear button for single-value when something is selected */}
        {single && singleSelected && !open && (
          <button
            type="button"
            className="skos-picker-clear"
            onClick={(e) => {
              e.stopPropagation();
              remove(singleSelected.id);
            }}
            aria-label="Clear selection"
            title="Clear"
          >
            <X size={14} />
          </button>
        )}

        <span className="skos-picker-caret">
          <ChevronDown size={16} />
        </span>
      </div>

      {open && (
        <div className="skos-picker-panel">
          {suggestions.length > 0 && (
            <div className="skos-picker-suggestions">
              <div className="skos-picker-suggestions-label">
                <Sparkles size={12} /> Smart suggestions from content
              </div>
              <div className="skos-picker-suggestion-chips">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="skos-picker-suggestion"
                    title={s.definition || s.label}
                    onClick={() => toggle(s.id)}
                  >
                    <Tag size={11} />
                    {s.notation && (
                      <span className="suggest-notation">{s.notation}</span>
                    )}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="skos-picker-panel-header">
            <span>{scheme.label}</span>
            <span>
              {filtered.length} of {scheme.concepts.length}
              {config.sort === 'alpha' && ' · A→Z'}
              {config.sort === 'group' && ' · grouped'}
              {config.sort === 'natural' && ' · ordered'}
            </span>
          </div>
          <div className="skos-picker-options">
            {belowMinChars && (
              <div className="skos-picker-empty">
                Type at least {minChars} characters to filter.
              </div>
            )}
            {!belowMinChars && filtered.length === 0 && (
              <div className="skos-picker-empty">No concepts match “{query}”</div>
            )}
            {flatItems.map((item, idx) => {
              if (item.kind === 'header') {
                return (
                  <div key={`h-${item.label}`} className="skos-picker-group-header">
                    {item.label}
                  </div>
                );
              }
              const c = item.concept;
              const isSelected = selectedIds.includes(c.id);
              const conceptIdx = conceptItemIndices.indexOf(idx);
              const isActive = conceptIdx === activeIdx;
              return (
                <div
                  key={c.id}
                  className={`skos-picker-option ${
                    isActive ? 'active' : ''
                  } ${isSelected ? 'selected' : ''} ${
                    c.isCatchall ? 'catchall' : ''
                  }`}
                  onMouseEnter={() => setActiveIdx(conceptIdx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(c.id);
                  }}
                >
                  <span className="check">
                    {isSelected && <Check size={14} />}
                  </span>
                  <div className="label-block">
                    <div className="label-line">
                      {c.notation && (
                        <span className="label-notation">{c.notation}</span>
                      )}
                      <span className="label-text">{highlight(c.label)}</span>
                      {c.altLabels?.length > 0 && (
                        <span className="label-alts">
                          ({c.altLabels.join(' / ')})
                        </span>
                      )}
                      {c.broader && (
                        <span className="label-broader" title={`Narrower of ${c.broader}`}>
                          ⤷ {c.broader}
                        </span>
                      )}
                      {c.related?.length > 0 && (
                        <span
                          className="label-related"
                          title={`Related: ${c.related.map((r) => r.conceptId).join(', ')}`}
                        >
                          ↔ related ({c.related.length})
                        </span>
                      )}
                      {c.hiddenLabels?.length > 0 &&
                        query &&
                        c.hiddenLabels.some((h) =>
                          h.toLowerCase().includes(query.toLowerCase())
                        ) && (
                          <span className="label-hidden-match" title="Matched a hidden label (typo/variant)">
                            via hiddenLabel
                          </span>
                        )}
                      {c.isCatchall && (
                        <span className="label-catchall-badge">catch-all</span>
                      )}
                    </div>
                    {c.definition && (
                      <div className="label-definition">
                        <Info size={10} /> {c.definition}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="skos-picker-footer">
            <span>
              <i className="bi bi-link-45deg" /> Taxonomy · <code>cs:{scheme.id}</code>
            </span>
            <span>↑↓ navigate · ↵ select · esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}
