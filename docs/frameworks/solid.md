# `<skos-picker>` in SolidJS

Solid renders custom elements natively and forwards attributes/properties and
events to them. No wrapper needed.

## Register and use

```jsx
import '@knowsy/skos-picker/web-component';
import { createSignal } from 'solid-js';

function TagForm() {
  const [cuisine, setCuisine] = createSignal('Italian');

  return (
    <>
      <skos-picker
        scheme-id="Cuisine"
        data-source="/api/vocab/Cuisine"
        placeholder="Pick a cuisine…"
        prop:value={cuisine()}
        on:change={(e) => setCuisine(e.detail.value)}
      />
      <p>Selected: {cuisine()}</p>
    </>
  );
}
```

Notes:
- Use `prop:value` to set the **property** (so arrays for multi-select pass
  through as-is, not stringified into an attribute).
- `on:change` binds the native `change` event; the payload is on
  `e.detail.value`.

## Multi-select

```jsx
const [genres, setGenres] = createSignal([]); // string[]

<skos-picker
  scheme-id="Music-Genre"
  multiple
  prop:value={genres()}
  on:change={(e) => setGenres(e.detail.value)}
/>
```
