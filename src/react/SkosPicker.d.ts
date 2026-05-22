import type { FC } from 'react';

/** Value held by the picker: a concept id (single) or ids (multi). */
export type SkosPickerValue = string | string[] | null;

export interface SkosPickerProps {
  /** Id of the scheme in the data tables (e.g. "Cuisine"). */
  schemeId: string;
  /** Selected concept id (single) or array of ids (multi). */
  value: SkosPickerValue;
  /** Called with the new value when the selection changes. */
  onChange: (value: SkosPickerValue) => void;
  /** Allow multiple selections (chips). Defaults to false. */
  multiple?: boolean;
  /** Input placeholder text. */
  placeholder?: string;
  /** Free text used to compute "smart" suggestions. */
  contextText?: string;
  /** Minimum characters before the live filter kicks in. Defaults to 0. */
  minChars?: number;
}

declare const SkosPicker: FC<SkosPickerProps>;
export default SkosPicker;
