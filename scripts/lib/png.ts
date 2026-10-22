/**
 * PNG rasterisation of the generated pennant SVGs.
 */
import sharp, { type PngOptions } from 'sharp';
import { SHAPE_SIZE, type PennantShape } from '../../src/shapes.ts';

/** Pixel densities written to `png/<scale>x/`. */
export const PNG_SCALES = [1, 2] as const;

/**
 * Quantised (palette) PNG: ~half the size of truecolour output and visually
 * identical at these sizes (measured < 0.05 % pixelmatch-different pixels
 * across all flags at threshold 0.1).
 */
export const PNG_OPTIONS = {
  palette: true,
  quality: 90,
  effort: 10,
  compressionLevel: 9,
} as const satisfies PngOptions;

export function pngSize(
  scale: number,
  shape: PennantShape = 'pennant',
): { width: number; height: number } {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new Error(`Invalid PNG scale ${scale}`);
  }
  const { width, height } = SHAPE_SIZE[shape];
  return { width: width * scale, height: height * scale };
}

/**
 * Rasterises a `shape` SVG at `scale` times its intrinsic size. The SVG is
 * rendered at the matching density (72 dpi = 1x), so vectors stay sharp
 * instead of being upscaled from a 1x bitmap.
 */
export function renderPng(
  svg: string | Buffer,
  scale = 1,
  shape: PennantShape = 'pennant',
): Promise<Buffer> {
  const { width, height } = pngSize(scale, shape);
  return sharp(Buffer.from(svg), { density: 72 * scale })
    .resize(width, height)
    .png(PNG_OPTIONS)
    .toBuffer();
}

/**
 * `Promise.all(items.map(fn))` with at most `limit` calls in flight, so a
 * few hundred sharp pipelines don't all hold decoded images at once.
 * Results keep input order; the first rejection rejects the whole call.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Invalid concurrency limit ${limit}`);
  }
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index] as T, index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
