/**
 * Angular adapter for the <skos-picker> web component.
 *
 * The picker itself is the framework-agnostic custom element in
 * ../../web-component/skos-picker.js — this file is a *thin* adapter, not a
 * reimplementation. It does two things Angular can't do automatically for a
 * custom element:
 *
 *   1. Implements ControlValueAccessor so <skos-picker> works with
 *      [(ngModel)] and reactive forms (formControlName) like a native input.
 *   2. Bridges the element's `value` property and its `change` event
 *      (detail.value) to Angular's value/touched lifecycle.
 *
 * Usage:
 *
 *   // 1. Register the element once (e.g. in main.ts):
 *   import '@knowsy/skos-picker/web-component';
 *
 *   // 2. Allow custom elements in the module/component that uses it:
 *   //    standalone component → schemas: [CUSTOM_ELEMENTS_SCHEMA]
 *   //    NgModule             → add CUSTOM_ELEMENTS_SCHEMA to schemas
 *
 *   // 3. Import this directive and bind:
 *   //    <skos-picker scheme-id="Cuisine"
 *   //                 [(ngModel)]="cuisine"></skos-picker>
 *
 * Multi-select: add the `multiple` attribute on the element; the bound value
 * becomes a string[] instead of a string.
 */
import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type SkosValue = string | string[] | null;

@Directive({
  selector: 'skos-picker',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SkosPickerValueAccessor),
      multi: true,
    },
  ],
})
export class SkosPickerValueAccessor implements ControlValueAccessor {
  private onChange: (value: SkosValue) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLElement & { value: SkosValue }>) {}

  /** The element fires a `change` CustomEvent with detail.value. */
  @HostListener('change', ['$event'])
  handleChange(event: Event): void {
    const detail = (event as CustomEvent<{ value: SkosValue }>).detail;
    this.onChange(detail ? detail.value : (this.el.nativeElement as any).value);
    this.onTouched();
  }

  /** Angular → element. */
  writeValue(value: SkosValue): void {
    this.el.nativeElement.value = value ?? null;
  }

  registerOnChange(fn: (value: SkosValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.el.nativeElement.setAttribute('disabled', '');
    else this.el.nativeElement.removeAttribute('disabled');
  }
}
