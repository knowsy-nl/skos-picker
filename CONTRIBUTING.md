# Contributing to @knowsy/skos-picker

Thanks for your interest in improving the SKOS picker! Contributions of all
kinds are welcome — bug reports, docs, tests, and code.

## Ground rules

- Be respectful. This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md).
- For anything non-trivial, **open an issue first** so we can agree on the
  approach before you invest time.
- Keep the core web component **dependency-free**. New runtime dependencies in
  `src/web-component/` will not be accepted.

## Development setup

```bash
git clone https://github.com/knowsy-nl/skos-picker.git
cd skos-picker
pnpm install        # pnpm is the project package manager (see packageManager)
pnpm run dev        # http://localhost:5173 — runs the demos
```

## Useful scripts

| Script                   | What it does                                  |
| ------------------------ | --------------------------------------------- |
| `pnpm test`              | Run the full Vitest suite once                |
| `pnpm test:watch`        | Watch mode                                    |
| `pnpm run build`         | Build the demo site                           |
| `pnpm run build:angular` | Compile the Angular adapter to `dist/angular` |
| `pnpm run lint`          | ESLint                                        |
| `pnpm run format`        | Prettier (write)                              |
| `pnpm run format:check`  | Prettier (check only — what CI runs)          |

## Before you open a PR

1. `pnpm test` passes (add/adjust tests for your change — see below).
2. `pnpm run lint` and `pnpm run format:check` are clean.
3. The demos still run (`pnpm run dev`).
4. Update `README.md` / `docs/` and `CHANGELOG.md` if behaviour changed.

## Testing expectations

- **Pure logic** (label/language resolution, value coercion, sorting) lives in
  `src/web-component/resolve.js` and is unit-tested in `resolve.test.js`. Put
  new logic here so it can be tested without the DOM.
- **Element / component behaviour** is tested in `*.dom.test.js` /
  `*.test.jsx` / `*.test.ts`.

A bug fix should come with a test that fails before the fix and passes after.

## Architecture in one paragraph

There is **one** implementation — the vanilla `<skos-picker>` custom element.
React gets a dedicated component (because React < 19 can't bind custom-element
props/events cleanly); Angular gets a thin `ControlValueAccessor`; Vue, Svelte
and Solid use the element directly. Please don't add full per-framework
reimplementations — keep the logic in one place.

## Commit messages & releases

- Clear, imperative commit subjects ("Fix …", "Add …").
- Releases are cut by maintainers via a version tag; see `CHANGELOG.md`.
