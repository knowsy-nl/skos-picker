# SKOS Picker — reusable taxonomy dropdown

A modern replacement for a Bootstrap `<select>` bound to a SKOS controlled
list. It searches preferred labels, alternative labels and *hidden* labels
(typos / variants / old names), shows notation badges, inline definitions,
parent/child grouping, and supports single- or multi-select.

This is a **standalone package** (`@taxonomy/skos-picker`) — it has no
dependency on any other repository. It ships **two interchangeable
implementations** so you can use whichever fits your stack:

| Implementation                  | What it is                             | Use when …                                              |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `src/web-component/skos-picker.js` | Vanilla `<skos-picker>` custom element | Server-rendered pages: `.cshtml` / `.razor` / `.aspx`, or any plain HTML. No build step, no framework. |
| `src/react/SkosPicker.jsx`         | React `<SkosPicker>` component         | A React SPA / island.                                   |

Both render the same UX and use the same data contract. Pick one — you do
not need both.

```
skos-picker/
├── package.json                ← @taxonomy/skos-picker
├── vite.config.js              ← dev server / demo build (not needed to consume the component)
├── index.html                  ← landing page linking to both demos
├── src/
│   ├── web-component/
│   │   └── skos-picker.js       ← drop-in custom element (self-contained, styles in shadow DOM)
│   ├── react/
│   │   ├── SkosPicker.jsx       ← React component
│   │   └── skos-picker.css      ← styles for the React component (import once)
│   └── data/
│       ├── skosSchemes.js       ← SAMPLE controlled lists (demo data — replace in production)
│       └── vocabEnrichments.js  ← SAMPLE altLabels / definitions / grouping (demo data)
├── demo/
│   ├── web-component-demo.html  ← runnable demo of the web component
│   ├── react-demo.html          ← runnable demo of the React component
│   └── react-demo.jsx
└── README.md
```

## Quick start (run the demos)

```bash
# with pnpm
pnpm install     # pulls vite + react + lucide-react (dev only)
pnpm run dev     # open the printed http://localhost:5173 URL

# or with npm
npm install
npm run dev
```

The landing page links to both the web-component and React demos. Nothing
here references any other project — this folder is self-contained.

> **Don't double-click the HTML files.** Opening them as `file://` paths
> won't work: browsers block ES-module imports (`<script type="module">`)
> over `file://`, so the picker silently fails to load. Always run through
> the dev server above (or any HTTP server).

> If you only need the vanilla web component, you don't even need Node: just
> serve the folder over any static HTTP server and open
> `demo/web-component-demo.html`. The custom element has **zero runtime
> dependencies**.

---

## Importing into your own project

Install it (from a registry, or a `file:`/workspace link):

```bash
pnpm add @taxonomy/skos-picker        # or: npm install @taxonomy/skos-picker
```

Then import what you need:

```js
// Vanilla custom element (registers <skos-picker>):
import '@taxonomy/skos-picker/web-component';

// React component + its styles:
import SkosPicker from '@taxonomy/skos-picker/react';
import '@taxonomy/skos-picker/react/styles.css';
```

(Or just copy the files under `src/` straight into your project — they are
plain ES modules with no build step.)

---

## Framework support

Because `<skos-picker>` is a standard **Web Component**, it works in every
major framework with the *same* single implementation — there's no separate
port to keep in sync. Each framework just binds to its `value` property and
`change` event (`event.detail.value`).

| Framework | How | Guide |
| --------- | --- | ----- |
| Plain HTML / Lit | Native — `<script>` tag, done. | [§1](#1-vanilla-web-component-srcweb-componentskos-pickerjs) above |
| **React** | Dedicated component (`@taxonomy/skos-picker/react`). | [§2](#2-react-component-srcreactskospickerjsx) above |
| **Angular** | Ships a `ControlValueAccessor` directive for `ngModel` / reactive forms (`@taxonomy/skos-picker/angular`). | [docs/frameworks/angular.md](docs/frameworks/angular.md) |
| **Vue 3** | Native — `v-model` works with one compiler flag. | [docs/frameworks/vue.md](docs/frameworks/vue.md) |
| **Svelte** | Native, including `bind:value`. | [docs/frameworks/svelte.md](docs/frameworks/svelte.md) |
| **SolidJS** | Native — `prop:value` + `on:change`. | [docs/frameworks/solid.md](docs/frameworks/solid.md) |

See [docs/frameworks/](docs/frameworks/) for the per-framework guides. Only
React and Angular ship adapter code; Vue/Svelte/Solid use the element
directly (the guides show the exact binding syntax).

---

## 1. Vanilla web component (`src/web-component/skos-picker.js`)

Drop one `<script type="module">` tag into the page and use the element
like a native form control:

```html
<script type="module" src="/path/to/skos-picker.js"></script>

<form>
  <skos-picker
    name="CuisineId"
    scheme-id="Cuisine"
    value="Italian"
    placeholder="Pick a cuisine…"
    data-source="/api/vocab/Cuisine">
  </skos-picker>
</form>
```

The element is **form-associated**: inside a `<form>` its value is submitted
under the `name` attribute exactly like an `<input>`/`<select>`, and it fires
a `change` event on every selection.

### Attributes

| Attribute            | Meaning                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `scheme-id`          | **Required.** Id of the controlled list (last segment of the list IRI). |
| `value`              | Current value (single string, or comma-separated IRIs for multi).       |
| `name`               | Form field name for form-data submission.                               |
| `multiple`           | Presence → multi-select with chips.                                     |
| `placeholder`        | Custom placeholder text.                                                |
| `disabled`           | Disable the control.                                                    |
| `min-chars`          | Min characters before the in-panel filter kicks in (default 0).         |
| `lang`               | BCP-47 tag (`en`, `nl`, `de`…) selecting the display language. **Optional** — defaults to `<html lang>`, then `en`. See [§4](#4-languages-i18n). |
| `lang-default`       | Optional fallback tag used when `lang` is missing from a language map.  |
| `data-source`        | **Production data URL** — see §3. Without it, falls back to bundled demo data. |
| `hide-footer`, `hide-scheme-code`, `hide-key-hints`, `hide-notations`, `hide-alt-labels`, `hide-definitions`, `hide-counter`, `hide-group-headers` | Turn off individual visual touches. |

### Theming

Set CSS custom properties on `:host` or any ancestor — e.g.
`--skos-picker-border`, `--skos-picker-border-focus`, `--skos-picker-active-bg`,
`--skos-picker-chip-bg`, `--skos-picker-chip-fg`, `--skos-picker-notation-bg`,
`--skos-picker-notation-fg`, `--skos-picker-radius`, `--skos-picker-bg`.
(Full list documented at the top of `skos-picker.js`.)

### Try the demo

Run `pnpm install && pnpm run dev` (or `npm install && npm run dev`) — see
Quick start above. Or, since the web component has no dependencies, serve
the folder with any static HTTP server and open `demo/web-component-demo.html`
(ES-module imports don't work over `file://`).

---

## 2. React component (`src/react/SkosPicker.jsx`)

```jsx
import SkosPicker from '@taxonomy/skos-picker/react';
import '@taxonomy/skos-picker/react/styles.css';   // import the styles once
// (or relative paths if you copied src/ in: './src/react/SkosPicker.jsx', etc.)

<SkosPicker
  schemeId="Cuisine"
  value={value}
  onChange={setValue}
  multiple={false}
  placeholder="Pick a cuisine…"
  contextText={someFreeText}             // optional → drives "smart suggestions"
/>
```

**Peer dependencies:** `react`, `react-dom`, and `lucide-react` (icons).

> Note: the React version currently reads the bundled `data/` tables directly
> (it does not yet take a `data-source` URL). For production, either point
> `data/skosSchemes.js` + `data/vocabEnrichments.js` at your real lists, or
> adapt the two imports at the top of `SkosPicker.jsx` to fetch from your API.
> The vanilla web component (§1) already supports a remote `data-source` out
> of the box, so for server-rendered pages it's the lower-friction option.

---

## 3. Production data source (the `data-source` contract)

For the demo, both components import the **sample** tables in `data/`. In
production, drive the web component from your own endpoint via the
`data-source` attribute. The endpoint must return JSON in this shape — the
canonical identifier for the list and each value is its **IRI** (the same
stable URL the SKOS source issues), which is what makes cross-system joins
exact:

```jsonc
{
  "id":    "https://example.org/vocab/Cuisine",              // required, list IRI
  "label": "Cuisine",                                        // required, panel header
  "concepts": [                                              // required, may be empty
    {
      "id":           "https://example.org/vocab/Cuisine/Italian",
      "label":        "Italian",                             // required, main name
      "altLabels":    ["Mediterranean"],                     // optional, shown + searchable
      "hiddenLabels": ["italiano", "it"],                    // optional, searchable only
      "definition":   "Cooking traditions of Italy.",        // optional, scope note
      "notation":     null,                                  // optional, short code badge
      "group":        "Europe"                               // optional, group header
    }
  ]
}
```

Required: `id`, `label`, `concepts`; per concept `id`, `label`. Everything
else is optional — the picker degrades gracefully when fields are missing.

### Mapping from SKOS and SKOS-XL

This JSON is a flattened projection of SKOS — and SKOS-XL maps onto it just
as cleanly. Do the projection wherever your taxonomy lives (a SPARQL
`CONSTRUCT`, a build step, or your API layer); the element itself is
RDF-library-free and stays zero-dependency.

| JSON field             | SKOS                          | SKOS-XL                                            |
| ---------------------- | ----------------------------- | -------------------------------------------------- |
| `scheme.id`            | `skos:ConceptScheme` IRI      | same                                               |
| `scheme.label`         | `dct:title` / `rdfs:label`    | same                                               |
| `concept.id`           | `skos:Concept` IRI            | same                                               |
| `concept.label`        | `skos:prefLabel`              | `skosxl:prefLabel` → `skosxl:literalForm`          |
| `concept.altLabels`    | `skos:altLabel`               | `skosxl:altLabel` → `skosxl:literalForm`           |
| `concept.hiddenLabels` | `skos:hiddenLabel`            | `skosxl:hiddenLabel` → `skosxl:literalForm`        |
| `concept.definition`   | `skos:definition` / `scopeNote` | same                                             |
| `concept.notation`     | `skos:notation`               | same                                               |
| `concept.broader`      | `skos:broader` (parent IRI)   | same                                               |
| `concept.group`        | grouping concept / `skos:Collection` | same                                       |

**SKOS-XL:** the picker consumes plain literal label *strings*, not the
reified `skosxl:Label` resources. A SKOS-XL source resolves each
`skosxl:prefLabel`/`altLabel`/`hiddenLabel` to its `skosxl:literalForm` and
emits the string. For language, resolve labels to the requested language
server-side (the picker forwards the browser's `Accept-Language`).

**Server-side notes**
- The submitted value is the full **IRI** of the selected concept (comma-
  separated IRIs for multi-select). Store it as an indexed string column.
- Set `Cache-Control: public, max-age=3600` (or longer) if your lists change
  rarely.
- For multi-language, either return labels resolved to the requested language
  (the picker forwards `Accept-Language` and `?lang=<lang>`), or return
  language maps and let the picker switch client-side. See [§4](#4-languages-i18n).
- On a 4xx/5xx or network error the element falls back to bundled data. In
  production, log server-side and return a sensible default.
- Common URL patterns: `/api/vocab/{listId}`, `/api/taxonomy/lists/{listId}`,
  where `{listId}` is the last segment of the list IRI. The response can be
  served straight out of the local mirror tables populated by your taxonomy
  management system.

---

## 4. Languages (i18n)

The picker displays one language at a time. **Language is optional** — with
no `lang` attribute and no `<html lang>`, it falls back to `en`, and data
with no language information at all works unchanged. The selected `value` is
always the language-neutral concept **IRI**, so switching language never
changes what's submitted.

Two models are supported, and you can mix them per field:

**A) Server-resolved — one language at a time.** When the `data-source`
returns plain-string labels, the picker forwards the requested language to
your endpoint (an `Accept-Language: <lang>` header **and** a `?lang=<lang>`
query param) and re-fetches when `lang` changes. Your endpoint returns labels
already resolved to that language.

```html
<skos-picker scheme-id="Cuisine" lang="nl" data-source="/api/vocab/Cuisine">
</skos-picker>
<!-- GET /api/vocab/Cuisine?lang=nl   (Accept-Language: nl) -->
```

**B) Client-resolved — all languages at once.** A label may be a **language
map** instead of a string. The picker resolves the active language itself and
switches language on a `lang` change **without re-fetching** (the payload
already holds every language):

```jsonc
{
  "id": "https://example.org/vocab/Cuisine",
  "label": { "en": "Cuisine", "nl": "Keuken" },
  "concepts": [
    {
      "id": "https://example.org/vocab/Cuisine/Italian",
      "label":      { "en": "Italian", "nl": "Italiaans" },
      "altLabels":  [{ "en": "Mediterranean", "nl": "Mediterraans" }],
      "definition": { "en": "Cooking traditions of Italy.",
                      "nl": "Kooktradities van Italië." }
    }
  ]
}
```

Every label field (`label`, each entry of `altLabels` / `hiddenLabels`,
`definition`, `group`) may independently be a string **or** a map, so a
partially-translated vocabulary is fine.

**Untagged literals.** SKOS permits plain literals with **no language tag**.
In a language map, represent an untagged value with the key `"@none"`
(JSON-LD convention) or `""`. An untagged literal is treated as
language-neutral and used as a fallback when the requested language is absent.

**Resolution order** (applied per field): exact tag → primary subtag
(`en-GB` → `en`) → `lang-default` attribute → untagged (`@none` / `""`) →
`en` → first available.

---

## 5. About the sample data (`data/`)

`skosSchemes.js` and `vocabEnrichments.js` are **demo fixtures** so the
components run standalone without a backend:

- `skosSchemes.js` — the controlled lists (auto-generated from the source TTL).
- `vocabEnrichments.js` — hand-curated altLabels, hiddenLabels, definitions,
  grouping and cross-scheme links that the source TTL doesn't carry yet.

In production these are replaced by your `data-source` endpoint (§3). They're
included here only so the demo and the React component work out of the box.

---

## TypeScript

The components are written in JavaScript (no build step), but ship hand-written
type declarations so TypeScript users get full autocomplete and type-checking
on the public API:

- `src/web-component/skos-picker.d.ts` — the `<skos-picker>` element, its
  `value` / `multiple` API, the `change` event payload, the `data-source` JSON
  shape, and a `HTMLElementTagNameMap` entry so `document.querySelector('skos-picker')`
  is typed.
- `src/react/SkosPicker.d.ts` — props for the React `<SkosPicker>`.

The Angular adapter is authored in TypeScript directly.

---

## Testing

```bash
pnpm test          # run once (or: npm test)
pnpm test:watch    # watch mode
```

Tests run on [Vitest](https://vitest.dev) with `happy-dom` (46 tests across
all four entry points):

- `src/web-component/resolve.test.js` — pure logic: language resolution
  (fallback chain, untagged `@none`/`""` literals), value coercion
  (single/multi), and sort/group. These import the real `resolve.js` module.
- `src/web-component/skos-picker.dom.test.js` — the actual `<skos-picker>`
  element: registration, value coercion via attributes, the `change` event,
  and the `data-source` path (fetch, language resolution, switch-without-
  re-fetch, `Accept-Language`/`?lang=` forwarding, and fallback to bundled
  data on fetch failure).
- `src/react/SkosPicker.test.jsx` — the React component via Testing Library:
  opening the panel, listing/filtering concepts, single- and multi-select
  `onChange`, chips, empty state, and the unknown-scheme warning.
- `src/adapters/angular/skos-picker.directive.test.ts` — the Angular
  `ControlValueAccessor` in isolation (no TestBed): `writeValue` → element,
  `change` → `onChange`/`onTouched`, and `setDisabledState` → attribute.

The DOM-free logic lives in `resolve.js` precisely so it can be tested
directly rather than through the element. CI (`.github/workflows/ci.yml`)
runs the suite and the demo build on Node 20 and 22.

---

## License

MIT © Jeroen Steggink, knowsy. See [LICENSE](LICENSE).
