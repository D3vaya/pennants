/**
 * Per-flag coordinate precision. Rounding coordinates roughly halves detailed
 * coats of arms, but flags that draw tiny shapes in unit space and scale them
 * up through `<use>` (EU and NZ stars) collapse when rounded. Instead of
 * guessing, each candidate is rendered and compared with the lossless output,
 * and the smallest one that looks the same wins.
 */
import sharp from 'sharp';
import { PENNANT } from './pennant.ts';

/** Tried in order; the lossless default is the implicit last resort. */
export const PRECISION_CANDIDATES = [0, 1, 2] as const;

/**
 * Rounding shifts edges by a fraction of a pixel, which only nudges
 * anti-aliasing. Losing a shape (a star collapsing to a line) flips pixels
 * completely. So only pixels whose colour changes by more than
 * `STRONG_DELTA` count, and at most `MAX_STRONG_PIXELS` may change.
 * Calibrated on all 271 flags: harmless rounding stays <= 4, broken ones
 * (eu, nz, cn, gb-sct...) exceed 400.
 */
export const STRONG_DELTA = 160;
export const MAX_STRONG_PIXELS = 32;

/** Comparison scale: 4x (264x288) so details that matter when zoomed are checked. */
export const COMPARE_SCALE = 4;

export interface PrecisionChoice {
  precision: number;
  svg: string;
  diff: number;
}

async function rasterize(svg: string, scale: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 72 * scale })
    .resize(PENNANT.width * scale, PENNANT.height * scale)
    .ensureAlpha()
    .raw()
    .toBuffer();
}

/** Number of pixels whose colour or alpha changes by more than `STRONG_DELTA`. */
export async function strongDiff(a: string, b: string, scale = COMPARE_SCALE): Promise<number> {
  const [ra, rb] = await Promise.all([rasterize(a, scale), rasterize(b, scale)]);
  let changed = 0;
  for (let i = 0; i < ra.length; i += 4) {
    for (let c = 0; c < 4; c++) {
      if (Math.abs((ra[i + c] ?? 0) - (rb[i + c] ?? 0)) > STRONG_DELTA) {
        changed++;
        break;
      }
    }
  }
  return changed;
}

/**
 * Picks the lowest precision whose render has at most `maxDiff` strongly
 * changed pixels compared with the lossless SVG. `build(precision)` returns the pennant SVG for a precision.
 */
export async function pickPrecision(
  build: (precision: number) => string,
  lossless: number,
  { candidates = PRECISION_CANDIDATES, maxDiff = MAX_STRONG_PIXELS, compare = strongDiff } = {},
): Promise<PrecisionChoice> {
  const reference = build(lossless);
  for (const precision of candidates) {
    if (precision >= lossless) break;
    const svg = build(precision);
    if (svg.length >= reference.length) continue;
    const diff = await compare(svg, reference);
    if (diff <= maxDiff) return { precision, svg, diff };
  }
  return { precision: lossless, svg: reference, diff: 0 };
}
