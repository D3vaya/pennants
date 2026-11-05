# Changelog & upgrading

What changed in each release, and what to do when you upgrade. The full list is in
[CHANGELOG.md](https://github.com/D3vaya/pennants/blob/main/CHANGELOG.md).

## 0.2.0

A smaller install: the npm package goes from 2.81 MB to 1.96 MB packed (9.31 MB to 7.56 MB
unpacked). What your users download does not change.

### Removed from the npm package

| Removed                                                                      | Use instead                                                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pennants/sprite`, `sprite/pennant.svg`                                      | `sprite/pennant.svg` from the [release assets](./shapes#release-assets), or CSS classes  |
| `png/rect/`, `png/square/`, `png/circle/`                                    | `svg/<shape>/<code>.svg`, or the PNGs from the [release assets](./shapes#release-assets) |
| `pennantUrl(code, { format: 'png', shape })` for shapes other than `pennant` | `pennantUrl(code, { shape })` (SVG), or your own URL to a self-hosted PNG                |

These paths are also gone from jsDelivr and unpkg for `pennants@0.2.0`. URLs pinned to
`pennants@0.1.x` keep working.

Pennant PNGs (`png/pennant/1x/` and `png/pennant/2x/`), every SVG, the CSS and the JS API are
unchanged.

### Upgrading from 0.1.x

1. Search your code for `pennants/sprite`, `png/rect`, `png/square` and `png/circle`.
2. For each match, switch to the SVG file of the same shape (`svg/rect/cl.svg`), or download
   `pennants-assets-v0.2.0.zip` from the
   [GitHub release](https://github.com/D3vaya/pennants/releases/tag/v0.2.0) and serve the file
   yourself.
3. If you call `pennantUrl` with `format: 'png'`, only the `pennant` shape is accepted now;
   other shapes throw a `RangeError`.

### Added

- Every GitHub release attaches `pennants-assets-vX.Y.Z.zip`: PNGs of every shape, sprites of
  every shape and the SVG files. See [Release assets](./shapes#release-assets).

### Changed

- Releases are published with npm trusted publishing (OIDC) and provenance; the repository
  holds no npm token.

## 0.1.1

- Fixed the README on npmjs.com: badges and links now work there.

## 0.1.0

- First release: 271 flags in four shapes (pennant, rect, square, circle) as SVG, PNG, CSS
  classes, JS modules, a React component and a Web Component.
