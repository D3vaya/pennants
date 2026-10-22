# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/d3vaya/pennants/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/d3vaya/pennants/releases/tag/v0.1.0
