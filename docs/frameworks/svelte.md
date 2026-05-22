# `<skos-picker>` in Svelte

Svelte has first-class support for custom elements — no wrapper, no config
flag. Both Svelte 4 and Svelte 5 work.

## Register and use

```svelte
<script>
  import '@taxonomy/skos-picker/web-component';

  let cuisine = 'Italian';

  // The element fires a `change` CustomEvent with detail.value.
  function onChange(e) {
    cuisine = e.detail.value;
  }
</script>

<skos-picker
  scheme-id="Cuisine"
  data-source="/api/vocab/Cuisine"
  placeholder="Pick a cuisine…"
  value={cuisine}
  on:change={onChange}
/>

<p>Selected: {cuisine}</p>
```

> **Svelte 5** uses the new event syntax: `onchange={onChange}` instead of
> `on:change={onChange}`. The `detail.value` payload is the same.

## Two-way binding

`bind:value` works against the element's `value` property:

```svelte
<skos-picker scheme-id="Cuisine" bind:value={cuisine} />
```

(Binding catches programmatic and user changes; if you need the exact moment
of selection, prefer the explicit `change` handler above.)

## Multi-select

```svelte
<script>
  let genres = []; // string[]
</script>

<skos-picker
  scheme-id="Music-Genre"
  multiple
  value={genres}
  on:change={(e) => (genres = e.detail.value)}
/>
```
