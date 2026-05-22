# `<skos-picker>` in Angular

Angular renders custom elements natively but needs two things: permission to
use unknown elements, and a `ControlValueAccessor` to bind forms. The package
ships that accessor — you don't write it yourself.

## 1. Register the element and allow custom elements

```ts
// main.ts (or wherever you bootstrap)
import '@knowsy/skos-picker/web-component';
```

In the standalone component (or NgModule) that uses the picker, add the
custom-elements schema:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SkosPickerValueAccessor } from '@knowsy/skos-picker/angular';

@Component({
  selector: 'app-tag-form',
  standalone: true,
  imports: [FormsModule, SkosPickerValueAccessor],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <skos-picker
      scheme-id="Cuisine"
      data-source="/api/vocab/Cuisine"
      placeholder="Pick a cuisine…"
      [(ngModel)]="cuisine">
    </skos-picker>
    <p>Selected: {{ cuisine }}</p>
  `,
})
export class TagFormComponent {
  cuisine: string | null = 'Italian';
}
```

## 2. Reactive forms

The same directive works with `formControlName`:

```ts
form = new FormGroup({
  cuisine: new FormControl<string | null>('Italian'),
});
```

```html
<form [formGroup]="form">
  <skos-picker scheme-id="Cuisine" formControlName="cuisine">
  </skos-picker>
</form>
```

## 3. Multi-select

Add the `multiple` attribute; the bound value becomes a `string[]`:

```html
<skos-picker scheme-id="Music-Genre" multiple [(ngModel)]="genres">
</skos-picker>
```

```ts
genres: string[] = [];
```

## Without forms

If you don't need `ngModel`/reactive forms, you can skip the directive and
bind manually:

```html
<skos-picker
  scheme-id="Cuisine"
  [attr.value]="cuisine"
  (change)="cuisine = $event.detail.value">
</skos-picker>
```
