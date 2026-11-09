# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `pennantUrl` (`base`) and the React `size` prop no longer use regular expressions that backtrack
  quadratically on long inputs (CodeQL `js/polynomial-redos`).

### Changed

- README: explains what `<Pennant>` renders on the server and how to get the flag in the server
  HTML (`mode="img"` or `<PennantSvg>`), and shows the OpenSSF Scorecard badge.

## [0.2.0] - 2026-11-05

Smaller install: 1.96 MB packed / 7.56 MB unpacked, down from 2.81 MB / 9.31 MB.

### Removed

- **Breaking:** `pennants/sprite` and `pennants/sprite/pennant.svg`.
- **Breaking:** `png/rect/`, `png/square/` and `png/circle/` are no longer in the npm package (nor
  on jsDelivr/unpkg). Pennant PNGs (`png/pennant/1x/`, `png/pennant/2x/`) still ship.
- **Breaking:** `pennantUrl` throws a `RangeError` for `format: 'png'` with any shape other than
  `pennant`.

### Added

- Each GitHub release attaches `pennants-assets-vX.Y.Z.zip` with every PNG (all shapes) and every
  sprite (`sprite/<shape>.svg`), plus the SVG files.

### Changed

- Publishing uses npm trusted publishing (OIDC); the repository holds no npm token.

## [0.1.1] - 2026-11-05

### Fixed

- README on npm: badges and links to `LICENSE`, `NOTICE`, `CONTRIBUTING.md` and `SECURITY.md` are
  absolute, so they work on npmjs.com. The size badge is static and generated from the bundle
  snapshot instead of timing out on bundlejs.

### Changed

- Releases publish with npm 11, ready for npm trusted publishing (OIDC).

## [0.1.0] - 2026-10-22

First release.

### Added

- 271 flags (249 ISO 3166-1 codes plus regions and organizations) from the flag-icons artwork,
  in four shapes: `pennant` (default, 66 × 72), `rect` (4:3, 64 × 48), `square` and `circle`
  (48 × 48).
- Static assets per shape: `svg/<shape>/<code>.svg`, `png/<shape>/1x/` (plus `2x` for the
  pennant), `sprite/pennant.svg`, and stylesheets `pennants/css`, `pennants/css/rect`,
  `pennants/css/square`, `pennants/css/circle` (`.pn .pn-<code>`, size helpers `.pn-lg`,
  `.pn-2x` to `.pn-4x`), each with a `/cdn` variant pointing at version-pinned jsDelivr URLs
  and TypeScript declarations.
- Tree-shakable artwork modules: `pennants/art/1x1/<code>` and `pennants/art/4x3/<code>`.
- Core API: `loadFlag` (lazy, one chunk per flag), `loadPennant` (alias for the pennant
  shape), `renderFlag` (synchronous, for static artwork and SSR), `loadArt`, `getPennantName`
  (`Intl.DisplayNames`, no bundled ISO names), `pennantUrl`, `toDataUri`, `toEmoji`, `codes`,
  `isoCodes`, `isPennantCode`, `toPennantCode`, `SHAPES`, `SHAPE_SIZE`, `SHAPE_ART`, `isShape`,
  `toShape`, `DEFAULT_CDN_BASE` and the `PennantCode`, `PennantShape`, `FlagArt` and `ArtSet`
  types.
- Fetch mode: `pennants/fetch` (`fetchPennant`) loads flags over HTTP without the bundled
  loader map; also available as `<Pennant mode="fetch">` and the `base` attribute of
  `<pennant-flag>`.
- React (>= 18): `pennants/react` with `<Pennant>` (inline, fetch or `img` mode, `shape`) and
  `<PennantSvg art>`; safe to import from React Server Components (`<Pennant>` is a client
  module). `pennants/react/static` exports only `<PennantSvg>` and `pennantBox`.
- Web Component: `pennants/element` (`definePennantElement`, `PennantElement`,
  `PENNANT_ELEMENT_CSS`) and `pennants/element/register` (`<pennant-flag>`), with `shape`,
  `pennant-load` / `pennant-error` events, `--pennant-size` and `::part(svg)`. Styles use a
  constructable stylesheet, so no `'unsafe-inline'` is needed.
- Pennant bar theming with `--pennant-bar-light` / `--pennant-bar-dark` through
  `pennants/css/theme.css` (included in the pennant stylesheets), CSP-safe.

[Unreleased]: https://github.com/D3vaya/pennants/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/D3vaya/pennants/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/D3vaya/pennants/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/D3vaya/pennants/releases/tag/v0.1.0
