# Shapes spec (0.1.0) — internal design note

Goal: one library, four shapes, same API. Pennant stays the signature/default.

| Shape     | Canvas | Source art       | Frame                                               |
| --------- | ------ | ---------------- | --------------------------------------------------- |
| `pennant` | 66x72  | flag-icons `1x1` | golden bar + V point + 3px darkening border (today) |
| `rect`    | 64x48  | flag-icons `4x3` | 2px darkening border, corner radius 2               |
| `square`  | 48x48  | flag-icons `1x1` | 2px darkening border, corner radius 2               |
| `circle`  | 48x48  | flag-icons `1x1` | circular clip + 2px darkening ring                  |

Same design language for all: inner border = black at 30% opacity, so the family reads as one set.
The border width scales with the canvas (`BORDER_WIDTH`): 3px on the 66px pennant, 2px on the
48–64px shapes, so all four carry the same visual weight.

## Single source of truth

- `src/shapes.ts` (runtime, tiny, no deps): `SHAPES`, `type PennantShape`, `SHAPE_SIZE[shape]`,
  `composeFlag(art, shape, idPrefix?)` → SVG string. Art = `{ code, viewBox, content }`.
- The generator (`scripts/`) imports `composeFlag` from `src/shapes.ts` to build static files,
  so static and runtime output are byte-identical.
- CSP-safe: no inline `style` attributes; bar colours via presentation attributes + optional
  theming rule in CSS (see CSP work in the current round).

## Artwork, not prebuilt strings, in JS

- Per-flag JS modules export artwork, not framed SVG, so each flag's art is bundled once no
  matter how many shapes an app uses:
  - `pennants/art/1x1/<code>` and `pennants/art/4x3/<code>` → `export default { code, viewBox, content }`.
- Core: `loadFlag(code, { shape = 'pennant' })` loads the right art lazily and composes.
  `loadPennant(code)` stays as alias for `loadFlag(code, { shape: 'pennant' })`.
- `renderFlag(art, { shape })` → string, for static imports / SSR.
- Precision picking (`pickPrecision`) runs on art per set; compare renders in the shape that
  shows the most of the art (rect for 4x3, square for 1x1).

## Static assets

- `svg/<shape>/<code>.svg`; `png/pennant/{1x,2x}/<code>.png` and `png/<shape>/1x/<code>.png`
  for the other shapes (2x only for the pennant, to keep the package light).
- Sprites: `sprite/<shape>.svg` (symbol ids `pn-<code>`; the file name selects the shape). Only
  `sprite/pennant.svg` is published (`pennants/sprite`); the others are built by
  `npm run generate` and offered as release assets.
- Install budget: `check:package` fails when the unpacked package exceeds 10 MB.
- CSS: one file per shape to stay light: `pennants/css` (pennant), `pennants/css/rect`,
  `pennants/css/square`, `pennants/css/circle`, each with `.cdn` variant and `.d.ts`.
  Each shape has its own base class — `.pn` (pennant), `.pn-rect`, `.pn-square`, `.pn-circle` —
  sized by the shape's aspect ratio, and flag rules are scoped to it (`.pn-circle.pn-ar`), so
  several stylesheets mix on one page. One base class per element; `.pn-lg`/`.pn-2x`… work with
  all of them.
- `pennantUrl(code, { shape, format, scale, base })`.

## Components

- React: `<Pennant code shape="circle" />` (default `pennant`), `<PennantSvg art={ar} shape />`.
- Element: `<pennant-flag code="ar" shape="circle">`.
- `pennantBox(size, shape)` respects the shape's aspect ratio.

## Budgets

- Install size will grow; set a tarball budget and report it. Bundle budgets per probe stay
  as today (art modules ≈ today's per-flag modules minus ~700 B frame each).
