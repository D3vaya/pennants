import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { buildPennant } from '../scripts/lib/pennant.ts';
import { composeFlag } from '../src/shapes.ts';
import { mapLimit, PNG_SCALES, pngSize, renderPng } from '../scripts/lib/png.ts';

const svg = buildPennant({
  code: 'jp',
  viewBox: '0 0 8 8',
  content: '<path fill="#fff" d="M0 0h8v8H0z"/><circle cx="4" cy="4" r="2" fill="#bc002d"/>',
});

describe('pngSize', () => {
  it('multiplies the 66x72 pennant canvas by default', () => {
    expect(PNG_SCALES.map((scale) => pngSize(scale))).toEqual([
      { width: 66, height: 72 },
      { width: 132, height: 144 },
    ]);
  });

  it('follows the shape size', () => {
    expect(pngSize(2, 'rect')).toEqual({ width: 128, height: 96 });
    expect(pngSize(1, 'circle')).toEqual({ width: 48, height: 48 });
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects scale %s', (scale) => {
    expect(() => pngSize(scale)).toThrow('Invalid PNG scale');
  });
});

describe('renderPng', () => {
  it.each([1, 2])('renders a palette PNG at %sx', async (scale) => {
    const meta = await sharp(await renderPng(svg, scale)).metadata();
    expect(meta).toMatchObject({
      format: 'png',
      width: 66 * scale,
      height: 72 * scale,
      isPalette: true,
      hasAlpha: true,
    });
  });

  it('keeps the transparent area outside the point and the flag inside', async () => {
    const { data, info } = await sharp(await renderPng(Buffer.from(svg)))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => [
      ...data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4),
    ];
    expect(px(0, 71)[3]).toBe(0);
    expect(px(33, 40)).toEqual([188, 0, 45, 255]);
  });
});

describe('renderPng shapes', () => {
  it('renders a circle at its own size, transparent in the corners', async () => {
    const circle = composeFlag(
      { code: 'jp', viewBox: '0 0 8 8', content: '<path fill="#fff" d="M0 0h8v8H0z"/>' },
      'circle',
    );
    const { data, info } = await sharp(await renderPng(circle, 2, 'circle'))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([96, 96]);
    expect(data[3]).toBe(0);
    expect(data[(48 * 96 + 48) * 4 + 3]).toBe(255);
  });
});

describe('mapLimit', () => {
  it('keeps order and never exceeds the limit', async () => {
    let active = 0;
    let peak = 0;
    const result = await mapLimit([5, 1, 4, 2, 3], 2, async (n, i) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, n));
      active--;
      return n * 10 + i;
    });
    expect(result).toEqual([50, 11, 42, 23, 34]);
    expect(peak).toBe(2);
  });

  it('handles empty input', async () => {
    expect(await mapLimit([], 4, async () => 1)).toEqual([]);
  });

  it('propagates rejections', async () => {
    await expect(
      mapLimit([1], 1, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it.each([0, 1.5])('rejects limit %s', async (limit) => {
    await expect(mapLimit([1], limit, async () => 1)).rejects.toThrow('Invalid concurrency');
  });
});
