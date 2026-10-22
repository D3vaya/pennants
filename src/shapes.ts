/**
 * Flag shapes: the single source of truth for frame geometry and SVG
 * composition. Used at runtime (components, `renderFlag`) and by the
 * generator for the static `svg/`, `png/`, `sprite/` and `css/` assets, so
 * both produce byte-identical markup.
 *
 * Every shape shares one design language: the artwork is clipped to the
 * shape's outline and a 3 px inner border darkens it by 30 %. The pennant
 * adds its golden hanging bar and V point.
 *
 * Pure string functions without dependencies: safe on the server and tiny.
 * @packageDocumentation
 */

/** Every available shape. `pennant` is the default and the library's signature. */
export const SHAPES = ['pennant', 'rect', 'square', 'circle'] as const;

/** A flag shape: `'pennant'` (default), `'rect'` (4:3), `'square'` or `'circle'`. */
export type PennantShape = (typeof SHAPES)[number];

/** Source artwork set: flag-icons' square (`1x1`) or 4:3 (`4x3`) drawings. */
export type ArtSet = '1x1' | '4x3';

/** Flag artwork, as exported by the `pennants/art/<set>/<code>` modules. */
export interface FlagArt {
  /** Lowercase flag code, e.g. `ar` or `gb-eng`. Its ids use the `pn-<code>-` prefix. */
  code: string;
  /** `viewBox` of the source drawing. */
  viewBox: string;
  /** Inner markup of the source drawing (everything inside its root `<svg>`). */
  content: string;
}

/** Intrinsic size in CSS pixels of each shape's SVG. */
export const SHAPE_SIZE: Readonly<Record<PennantShape, { width: number; height: number }>> = {
  pennant: { width: 66, height: 72 },
  rect: { width: 64, height: 48 },
  square: { width: 48, height: 48 },
  circle: { width: 48, height: 48 },
};

/** Artwork set each shape is drawn from. */
export const SHAPE_ART: Readonly<Record<PennantShape, ArtSet>> = {
  pennant: '1x1',
  rect: '4x3',
  square: '1x1',
  circle: '1x1',
};

/** Pennant-specific geometry, matching the hand-made references (66x72 px). */
export const PENNANT = {
  width: 66,
  height: 72,
  /** Height of the golden hanging bar. */
  barHeight: 9,
  /** y coordinate where the straight sides end and the V point begins. */
  shoulderY: 50,
  barLight: '#d5b97a',
  barDark: '#8e713f',
} as const;

/** Inner border shared by all shapes: 3 px of black at 30 % opacity. */
export const BORDER = { width: 3, opacity: 0.3 } as const;

/** Corner radius of `rect` and `square`. */
export const CORNER_RADIUS = 2;

/**
 * Classes on the pennant bar gradient stops. The stops carry gold
 * `stop-color` attributes (CSP-safe, no inline styles); the optional
 * `pennants/css/theme.css` rule maps these classes to the
 * `--pennant-bar-light` / `--pennant-bar-dark` custom properties.
 */
export const BAR_CLASS = { light: 'pn-bar-l', dark: 'pn-bar-d' } as const;

/** Outline of the pennant body: bar bottom edge, straight sides, V point. */
export const PENNANT_PATH = `M0 ${PENNANT.barHeight}H${PENNANT.width}V${PENNANT.shoulderY}L${
  PENNANT.width / 2
} ${PENNANT.height}L0 ${PENNANT.shoulderY}Z`;

/** Path of a `width` x `height` rectangle with corner radius `r`. */
export function roundedRectPath(width: number, height: number, r: number): string {
  const arc = `A${r} ${r} 0 0 1`;
  return (
    `M${r} 0H${width - r}${arc} ${width} ${r}V${height - r}${arc} ${width - r} ${height}` +
    `H${r}${arc} 0 ${height - r}V${r}${arc} ${r} 0Z`
  );
}

/** Path of a circle inscribed in a `size` x `size` box. */
export function circlePath(size: number): string {
  const r = size / 2;
  return `M0 ${r}A${r} ${r} 0 1 1 ${size} ${r}A${r} ${r} 0 1 1 0 ${r}Z`;
}

/** Outline path each shape clips its artwork to (and strokes for the border). */
export const SHAPE_PATH: Readonly<Record<PennantShape, string>> = {
  pennant: PENNANT_PATH,
  rect: roundedRectPath(SHAPE_SIZE.rect.width, SHAPE_SIZE.rect.height, CORNER_RADIUS),
  square: roundedRectPath(SHAPE_SIZE.square.width, SHAPE_SIZE.square.height, CORNER_RADIUS),
  circle: circlePath(SHAPE_SIZE.circle.width),
};

const CODE_PATTERN = /^[a-z]{2,6}(-[a-z]{2,3})?$/;
const PREFIX_PATTERN = /^[A-Za-z][\w-]*$/;

/** `true` for a valid shape name. */
export function isShape(value: unknown): value is PennantShape {
  return (SHAPES as readonly unknown[]).includes(value);
}

/**
 * Wraps flag artwork in a shape's frame and returns a standalone SVG.
 *
 * Ids (the frame's and the artwork's) use the `pn-<code>-` prefix, so
 * different flags can be inlined in one document. Pass `idPrefix` to give
 * one instance its own namespace when the same flag appears several times.
 *
 * @param art - artwork from `pennants/art/<set>/<code>`; use the set given
 *   by {@link SHAPE_ART} (`4x3` for `rect`, `1x1` otherwise).
 * @param shape - frame to draw, `'pennant'` by default.
 * @param idPrefix - replaces `pn-<code>-` in every id and reference.
 * @throws if the code, shape or prefix is invalid (they end up in markup).
 */
export function composeFlag(
  art: FlagArt,
  shape: PennantShape = 'pennant',
  idPrefix = `pn-${art.code}-`,
): string {
  const { code, viewBox } = art;
  if (!CODE_PATTERN.test(code)) throw new Error(`Invalid flag code "${code}"`);
  if (!isShape(shape)) throw new Error(`Invalid shape "${String(shape)}"`);
  if (!PREFIX_PATTERN.test(idPrefix)) throw new Error(`Invalid id prefix "${idPrefix}"`);

  const own = `pn-${code}-`;
  const content = idPrefix === own ? art.content : art.content.split(own).join(idPrefix);
  const { width, height } = SHAPE_SIZE[shape];
  const outline = SHAPE_PATH[shape];
  const top = shape === 'pennant' ? PENNANT.barHeight : 0;
  const clipId = `${idPrefix}clip`;
  const barId = `${idPrefix}bar`;
  const bar =
    shape === 'pennant'
      ? [
          `<linearGradient id="${barId}" x1="0" y1="0" x2="0" y2="${top}" gradientUnits="userSpaceOnUse">` +
            `<stop offset="0" class="${BAR_CLASS.light}" stop-color="${PENNANT.barLight}"/>` +
            `<stop offset="1" class="${BAR_CLASS.dark}" stop-color="${PENNANT.barDark}"/>` +
            `</linearGradient>`,
          `<rect width="${width}" height="${top}" fill="url(#${barId})"/>`,
        ]
      : ['', ''];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<defs><clipPath id="${clipId}"><path d="${outline}"/></clipPath>${bar[0]}</defs>` +
    `<g clip-path="url(#${clipId})">` +
    `<svg x="0" y="${top}" width="${width}" height="${height - top}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice">${content}</svg>` +
    `<path d="${outline}" fill="none" stroke="#000" stroke-opacity="${BORDER.opacity}" stroke-width="${BORDER.width * 2}"/>` +
    `</g>${bar[1]}</svg>`
  );
}
