# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - Unreleased

### Added

- 271 pennant flags (249 ISO 3166-1 codes plus regions and organizations) generated from
  flag-icons 1x1 artwork.
- Static assets: `svg/`, `png/1x` (66 × 72), `png/2x` (132 × 144), `sprite/pennants.svg` and
  `css/pennants.min.css` (`.pn .pn-<code>`, size helpers `.pn-lg`, `.pn-2x` to `.pn-4x`).
- Tree-shakable per-flag modules: `pennants/flags/<code>`.
- Core API: `codes`, `isoCodes`, `PennantCode`, `isPennantCode`, `toPennantCode`, `loadPennant`,
  `getPennantName`, `toDataUri`, `pennantUrl`, `toEmoji`, `PENNANT_WIDTH`, `PENNANT_HEIGHT`,
  `PENNANT_ASPECT_RATIO`.
- React bindings: `pennants/react` with `<Pennant>` and `<PennantSvg>`.
- Web Component: `pennants/element` (`definePennantElement`) and `pennants/element/register`
  (`<pennant-flag>`).
- Bar colors themeable on inline SVG via `--pennant-bar-light` and `--pennant-bar-dark`.

[Unreleased]: https://github.com/d3vaya/pennants/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/d3vaya/pennants/releases/tag/v0.1.0
