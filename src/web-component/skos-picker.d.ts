/**
 * Type declarations for the <skos-picker> web component.
 * The implementation lives in skos-picker.js; importing the module
 * registers the custom element as a side effect.
 */

/** Value held by the picker: a concept IRI (single) or IRIs (multi). */
export type SkosPickerValue = string | string[] | null;

/**
 * A localizable label. Either a plain string (single language / untagged),
 * or a map of BCP-47 tag → string for the all-languages-at-once model.
 * SKOS untagged literals use the key "@none" or "" in the map.
 */
export type LocalizedLabel = string | { [bcp47OrNone: string]: string };

/** A single concept as returned by a `data-source` endpoint. */
export interface SkosConcept {
  /** Stable IRI of the concept. Required. */
  id: string;
  /** Preferred label (main name). Required. String or language map. */
  label: LocalizedLabel;
  /** Alternative names — searchable AND displayed. */
  altLabels?: LocalizedLabel[];
  /** Searchable-only synonyms/variants — never displayed. */
  hiddenLabels?: LocalizedLabel[];
  /** Inline scope note / definition. */
  definition?: LocalizedLabel;
  /** Short code shown as a badge (e.g. "L1", "FP"). */
  notation?: string | null;
  /** Group header (used when the scheme is grouped). */
  group?: LocalizedLabel;
  /** Parent concept IRI (skos:broader). */
  broader?: string | null;
}

/** Shape a `data-source` URL must return. */
export interface SkosScheme {
  /** Scheme IRI. Required. */
  id: string;
  /** Panel header label. Required. String or language map. */
  label: LocalizedLabel;
  /** Concepts in the scheme (may be empty). Required. */
  concepts: SkosConcept[];
}

/** Detail payload of the `change` CustomEvent. */
export interface SkosPickerChangeDetail {
  value: SkosPickerValue;
}

export type SkosPickerChangeEvent = CustomEvent<SkosPickerChangeDetail>;

/** The custom element class. */
export class SkosPickerElement extends HTMLElement {
  static readonly formAssociated: true;
  /** Current selection (property reflects/coerces the `value` attribute). */
  value: SkosPickerValue;
  /** Whether multi-select is enabled (mirrors the `multiple` attribute). */
  readonly multiple: boolean;
  addEventListener(
    type: 'change',
    listener: (this: SkosPickerElement, ev: SkosPickerChangeEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'skos-picker': SkosPickerElement;
  }
}
