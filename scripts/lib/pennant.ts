/**
 * Pennant frame geometry and SVG composition.
 *
 * The geometry mirrors the reference artwork in `reference/` (66x72 px):
 * a 9 px golden hanging bar on top, a flag body below it that ends in a
 * V-shaped point, and a 3 px inner border that darkens the flag by 30 %.
 */

export const PENNANT = {
  width: 66,
  height: 72,
  barHeight: 9,
  /** y coordinate where the straight sides end and the point begins. */
  shoulderY: 50,
  border: 3,
  borderOpacity: 0.3,
  barLight: '#d5b97a',
  barDark: '#8e713f',
} as const;

export const BODY_PATH = `M0 ${PENNANT.barHeight}H${PENNANT.width}V${PENNANT.shoulderY}L${
  PENNANT.width / 2
} ${PENNANT.height}L0 ${PENNANT.shoulderY}Z`;

/** Classes on the bar gradient stops, targeted by the theming stylesheet. */
export const BAR_CLASS = { light: 'pn-bar-l', dark: 'pn-bar-d' } as const;

export interface FlagArtwork {
  /** Lowercase flag code, e.g. `ar` or `gb-eng`. Used to namespace SVG ids. */
  code: string;
  /** `viewBox` of the source flag. */
  viewBox: string;
  /** Inner markup of the source flag (everything inside its root `<svg>`). */
  content: string;
}

const CODE_PATTERN = /^[a-z]{2,6}(-[a-z]{2,3})?$/;

export function assertValidCode(code: string): void {
  if (!CODE_PATTERN.test(code)) {
    throw new Error(`Invalid flag code "${code}"`);
  }
}

/** Splits a standalone SVG document into its `viewBox` and inner markup. */
export function unwrapSvg(svg: string): { viewBox: string; content: string } {
  const match = /^\s*(?:<\?xml[^>]*>\s*)?<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(svg);
  if (!match) {
    throw new Error('Input is not a single <svg> document');
  }
  const [, attributes = '', content = ''] = match;
  const viewBox = /\bviewBox="([^"]+)"/.exec(attributes)?.[1];
  if (!viewBox) {
    throw new Error('Source SVG has no viewBox');
  }
  return { viewBox, content: content.trim() };
}

/**
 * Wraps flag artwork in the pennant frame. Ids are namespaced with the flag
 * code so several different pennants can be inlined in one document.
 *
 * The bar gradient stops carry gold `stop-color` presentation attributes,
 * which work under a strict CSP (no inline `style`). For theming, the stops
 * also get the `pn-bar-l` / `pn-bar-d` classes: the shipped stylesheet maps
 * them to `--pennant-bar-light` / `--pennant-bar-dark` (see `themeCss`), and
 * stylesheet rules override presentation attributes when the SVG is inlined.
 */
export function buildPennant({ code, viewBox, content }: FlagArtwork): string {
  assertValidCode(code);
  const { width, height, barHeight, border, borderOpacity, barLight, barDark } = PENNANT;
  const clipId = `pn-${code}-clip`;
  const gradientId = `pn-${code}-bar`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<defs>` +
    `<clipPath id="${clipId}"><path d="${BODY_PATH}"/></clipPath>` +
    `<linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="${barHeight}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" class="${BAR_CLASS.light}" stop-color="${barLight}"/>` +
    `<stop offset="1" class="${BAR_CLASS.dark}" stop-color="${barDark}"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<g clip-path="url(#${clipId})">` +
    `<svg x="0" y="${barHeight}" width="${width}" height="${height - barHeight}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice">${content}</svg>` +
    `<path d="${BODY_PATH}" fill="none" stroke="#000" stroke-opacity="${borderOpacity}" stroke-width="${border * 2}"/>` +
    `</g>` +
    `<rect width="${width}" height="${barHeight}" fill="url(#${gradientId})"/>` +
    `</svg>`
  );
}
