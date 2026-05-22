# Changelog

All notable changes to this project are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-22

Initial public release.

### Added

- Vanilla `<skos-picker>` custom element — framework-agnostic, form-associated,
  zero runtime dependencies.
- React `<SkosPicker>` component (`@knowsy/skos-picker/react`).
- Angular `ControlValueAccessor` adapter (`@knowsy/skos-picker/angular`).
- Usage guides for Vue, Svelte and SolidJS (the element is used directly).
- `data-source` JSON contract that maps cleanly from SKOS and SKOS-XL.
- Multilingual support: server-resolved (one language per fetch) and
  client-resolved language maps (switch language with no re-fetch), with a
  documented fallback chain and SKOS untagged-literal (`@none` / `""`) handling.
- TypeScript declarations for the public API.
- Test suite (Vitest + happy-dom) covering pure logic, the web component,
  React and the Angular adapter.

[Unreleased]: https://github.com/knowsy-nl/skos-picker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/knowsy-nl/skos-picker/releases/tag/v1.0.0
