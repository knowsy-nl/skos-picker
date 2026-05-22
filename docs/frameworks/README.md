# Using `<skos-picker>` across the web ecosystem

The picker is a standard **custom element** (Web Component). Every modern
framework can render it directly — there is **one** implementation, not one
per framework, so behaviour and bug fixes stay in sync everywhere.

The element's contract is the same in all of them:

- **Attributes** for static config: `scheme-id`, `placeholder`, `multiple`,
  `min-chars`, `data-source`, `lang`, the `hide-*` flags. (See the main
  README §1.)
- **`value` property** for the current selection — a `string` (single) or
  `string[]` (multi).
- **`change` event** — a `CustomEvent` whose `detail.value` is the new value.

Register the element once at app startup:

```js
import '@taxonomy/skos-picker/web-component';
```

Then follow the per-framework guide:

| Framework | Guide | Needs a wrapper? |
| --------- | ----- | ---------------- |
| Angular   | [angular.md](./angular.md) | A small `ControlValueAccessor` directive (shipped) for `ngModel` / reactive forms. |
| Vue 3     | [vue.md](./vue.md)         | No — `v-model` works with one config flag. |
| Svelte    | [svelte.md](./svelte.md)   | No — native, including `bind:`. |
| SolidJS   | [solid.md](./solid.md)     | No — native. |
| React     | see main README §2         | Uses the dedicated React component (`@taxonomy/skos-picker/react`). |
| Plain HTML / Lit / others | main README §1 | No — it's a native element. |

> **Why React is different:** React versions before 19 didn't pass non-string
> props or listen to custom events on custom elements cleanly, so the package
> ships a dedicated React component. React 19+ can use the web component
> directly, but the React component is kept for ergonomics and back-compat.
