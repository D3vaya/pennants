import { SHAPE_ART, composeFlag, type ArtSet, type FlagArt, type PennantShape } from '../shapes.ts';
import { toShape } from './core.ts';

/** Options of {@link loadFlag} and {@link renderFlag}. */
export interface FlagOptions {
  /** Flag shape, `pennant` by default. */
  shape?: PennantShape;
}

/** Options of {@link loadArt}. */
export interface LoadArtOptions {
  /** Artwork set: `1x1` (default; pennant, square, circle) or `4x3` (rect). */
  set?: ArtSet;
}

/**
 * Loads one flag's artwork (`{ code, viewBox, content }`). Each flag and set
 * lives in its own chunk, so only what you request is downloaded. Rejects
 * with a `RangeError` for unknown codes.
 */
export async function loadArt(code: string, options: LoadArtOptions = {}): Promise<FlagArt> {
  // Each set's loader map is its own lazy chunk: apps that never draw a
  // `rect` never download the 4x3 map (and vice versa).
  if (options.set === '4x3') return (await import('./load-4x3.ts')).loadArt4x3(code);
  return (await import('./load-1x1.ts')).loadArt1x1(code);
}

/**
 * Wraps artwork in a shape's frame and returns a standalone SVG string.
 * Synchronous: use it with statically imported art for SSR, e.g.
 * `renderFlag(ar, { shape: 'circle' })` with `import ar from 'pennants/art/1x1/ar'`
 * (`rect` expects `pennants/art/4x3/<code>`).
 */
export function renderFlag(art: FlagArt, options: FlagOptions = {}): string {
  return composeFlag(art, toShape(options.shape ?? 'pennant'));
}

/**
 * Loads one flag and returns its SVG markup in the requested shape. The
 * artwork set matching the shape is loaded lazily (one chunk per flag).
 * Rejects with a `RangeError` for unknown codes or shapes.
 */
export async function loadFlag(code: string, options: FlagOptions = {}): Promise<string> {
  const shape = toShape(options.shape ?? 'pennant');
  return composeFlag(await loadArt(code, { set: SHAPE_ART[shape] }), shape);
}

/** Loads one flag as a pennant: alias of `loadFlag(code, { shape: 'pennant' })`. */
export function loadPennant(code: string): Promise<string> {
  return loadFlag(code);
}
