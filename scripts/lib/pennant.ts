/**
 * Build-time helpers around the runtime frame composition in `src/shapes.ts`
 * (which holds the geometry): code validation, SVG unwrapping, and the
 * pennant shortcut used by the generator and tests.
 */

import { composeFlag, type FlagArt } from '../../src/shapes.ts';

export { BAR_CLASS, PENNANT, PENNANT_PATH as BODY_PATH } from '../../src/shapes.ts';

/** Flag artwork (alias of the runtime `FlagArt`). */
export type FlagArtwork = FlagArt;

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

/** Wraps flag artwork in the pennant frame (see `composeFlag` in `src/shapes.ts`). */
export function buildPennant(art: FlagArtwork): string {
  assertValidCode(art.code);
  return composeFlag(art, 'pennant');
}
