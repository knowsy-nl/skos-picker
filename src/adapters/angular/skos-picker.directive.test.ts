// Angular ships partially-compiled; provide the JIT compiler so importing a
// decorated class outside the Angular CLI doesn't throw the "Linker has not
// processed the library" error. Must come before any @angular/* import.
import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkosPickerValueAccessor } from './skos-picker.directive.ts';

// Isolated unit test of the ControlValueAccessor — no TestBed / zone.js.
// We instantiate the directive with a fake ElementRef and verify it bridges
// Angular's form lifecycle to the <skos-picker> element's value property,
// `change` event, and disabled attribute.

function makeFakeElement() {
  const attrs = new Set<string>();
  return {
    value: null as string | string[] | null,
    setAttribute: vi.fn((name: string) => attrs.add(name)),
    removeAttribute: vi.fn((name: string) => attrs.delete(name)),
    hasAttr: (name: string) => attrs.has(name),
  };
}

function makeAccessor() {
  const native = makeFakeElement();
  const accessor = new SkosPickerValueAccessor({ nativeElement: native } as any);
  return { accessor, native };
}

describe('SkosPickerValueAccessor (Angular)', () => {
  let accessor: SkosPickerValueAccessor;
  let native: ReturnType<typeof makeFakeElement>;

  beforeEach(() => {
    ({ accessor, native } = makeAccessor());
  });

  it('writeValue pushes the value onto the element', () => {
    accessor.writeValue('Italian');
    expect(native.value).toBe('Italian');
  });

  it('writeValue coerces undefined/null to null on the element', () => {
    accessor.writeValue(null as any);
    expect(native.value).toBe(null);
    accessor.writeValue(undefined as any);
    expect(native.value).toBe(null);
  });

  it('writeValue handles an array (multi-select)', () => {
    accessor.writeValue(['Jazz', 'Rock']);
    expect(native.value).toEqual(['Jazz', 'Rock']);
  });

  it('a `change` event flows to the registered onChange with detail.value', () => {
    const onChange = vi.fn();
    accessor.registerOnChange(onChange);
    accessor.handleChange(new CustomEvent('change', { detail: { value: 'French' } }));
    expect(onChange).toHaveBeenCalledWith('French');
  });

  it('a `change` event marks the control as touched', () => {
    const onTouched = vi.fn();
    accessor.registerOnTouched(onTouched);
    accessor.handleChange(new CustomEvent('change', { detail: { value: 'x' } }));
    expect(onTouched).toHaveBeenCalled();
  });

  it('falls back to the element value when the event has no detail', () => {
    const onChange = vi.fn();
    accessor.registerOnChange(onChange);
    native.value = 'FromElement';
    accessor.handleChange(new Event('change'));
    expect(onChange).toHaveBeenCalledWith('FromElement');
  });

  it('setDisabledState toggles the disabled attribute', () => {
    accessor.setDisabledState(true);
    expect(native.hasAttr('disabled')).toBe(true);
    accessor.setDisabledState(false);
    expect(native.hasAttr('disabled')).toBe(false);
  });
});
