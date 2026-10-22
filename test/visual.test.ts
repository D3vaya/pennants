/**
 * Visual regression against the hand-made references in `reference/`.
 *
 * Our flag artwork comes from flag-icons and legitimately differs from the
 * reference art, so the frame is checked strictly (golden bar, 3px darkening
 * border, transparent silhouette) and the whole image only loosely.
 * Thresholds were calibrated by measuring the references (see `LIMITS`); the
 * sample covers simple, striped, detailed and emblem-heavy flags.
 */
import { readFile } from 'node:fs/promises';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadFlagArtwork } from '../scripts/lib/flags.ts';
import { buildPennant, PENNANT } from '../scripts/lib/pennant.ts';
import { BORDER_WIDTH, composeFlag, SHAPE_ART, SHAPE_SIZE, type FlagArt } from '../src/shapes.ts';
import { renderPng } from '../scripts/lib/png.ts';

const SAMPLE = ['ar', 'us', 'jp', 'br', 'bz', 'de', 'gb', 'ca'];
const { width: W, height: H, barHeight } = PENNANT;

async function rgba(png: Buffer): Promise<Buffer> {
  return sharp(png).ensureAlpha().raw().toBuffer();
}

async function loadPair(code: string): Promise<{ ours: Buffer; ref: Buffer }> {
  const svg = buildPennant(await loadFlagArtwork(code));
  const [ours, ref] = await Promise.all([
    renderPng(svg).then(rgba),
    readFile(new URL(`../reference/banderin-${code}.png`, import.meta.url)).then(rgba),
  ]);
  return { ours, ref };
}

/** Largest per-channel difference within rows [0, rows). */
function maxChannelDiff(a: Buffer, b: Buffer, rows: number): number {
  let max = 0;
  for (let i = 0; i < W * rows * 4; i++) {
    max = Math.max(max, Math.abs((a[i] as number) - (b[i] as number)));
  }
  return max;
}

/** Alpha-channel differences: count above `cutoff` and mean over all pixels. */
function alphaDiff(a: Buffer, b: Buffer, cutoff: number): { over: number; mean: number } {
  let over = 0;
  let sum = 0;
  for (let i = 3; i < a.length; i += 4) {
    const d = Math.abs((a[i] as number) - (b[i] as number));
    sum += d;
    if (d > cutoff) over++;
  }
  return { over, mean: sum / (W * H) };
}

const lum = (p: Buffer, x: number, y: number): number => {
  const i = (y * W + x) * 4;
  return (p[i] as number) + (p[i + 1] as number) + (p[i + 2] as number);
};

/**
 * Median brightness ratio between the 3px border and the flag just inside it,
 * along the straight sides. Only rows where the flag is locally uniform count,
 * so the measure reflects the border darkening and not the artwork.
 */
function borderDarkening(p: Buffer): { ratio: number; samples: number } {
  const ratios: number[] = [];
  for (let y = barHeight + 3; y < PENNANT.shoulderY - 2; y++) {
    for (const [border, inner, deeper] of [
      [1, 4, 7],
      [W - 2, W - 5, W - 8],
    ] as const) {
      const i = lum(p, inner, y);
      const uniform =
        Math.abs(i - lum(p, deeper, y)) < 6 &&
        Math.abs(i - lum(p, inner, y - 1)) < 6 &&
        Math.abs(i - lum(p, inner, y + 1)) < 6;
      if (i > 60 && uniform) ratios.push(lum(p, border, y) / i);
    }
  }
  ratios.sort((a, b) => a - b);
  return { ratio: ratios[ratios.length >> 1] ?? Number.NaN, samples: ratios.length };
}

/**
 * Thresholds, with the worst value measured over the sample (and over all
 * 248 comparable references; `np` has a non-pennant reference silhouette):
 *   bar max channel diff      4 / 255   (all: 4)
 *   alpha diffs > 128         0 px      (all: 0)
 *   alpha diffs > 64          27 px     (all: 28; anti-aliasing of the V edges)
 *   mean alpha diff           2.6       (quantised PNG edge pixels)
 *   border darkening ratio    0.70, |ours - ref| <= 0.0011
 *   overall pixelmatch        23 % of pixels (br; all: 40 % for nc)
 */
const LIMITS = {
  barMaxChannelDiff: 8,
  alphaOver64: 32,
  alphaMean: 4,
  borderRatio: 0.7,
  borderTolerance: 0.01,
  borderMinSamples: 15,
  overall: 0.3,
};

function barMismatches(a: Buffer, b: Buffer): number {
  const bytes = W * barHeight * 4;
  return pixelmatch(a.subarray(0, bytes), b.subarray(0, bytes), null, W, barHeight, {
    threshold: 0.05,
  });
}

describe.each(SAMPLE)('pennant %s vs reference', (code) => {
  let ours: Buffer;
  let ref: Buffer;
  beforeAll(async () => {
    ({ ours, ref } = await loadPair(code));
  });

  it('has the same golden bar', () => {
    expect(barMismatches(ours, ref)).toBe(0);
    expect(maxChannelDiff(ours, ref, barHeight)).toBeLessThanOrEqual(LIMITS.barMaxChannelDiff);
  });

  it('has the same silhouette (transparent outside the V point)', () => {
    expect(alphaDiff(ours, ref, 128).over).toBe(0);
    const { over, mean } = alphaDiff(ours, ref, 64);
    expect(over).toBeLessThanOrEqual(LIMITS.alphaOver64);
    expect(mean).toBeLessThanOrEqual(LIMITS.alphaMean);
  });

  it('darkens the 3px border like the reference', () => {
    const mine = borderDarkening(ours);
    const theirs = borderDarkening(ref);
    expect(mine.samples).toBeGreaterThanOrEqual(LIMITS.borderMinSamples);
    expect(Math.abs(mine.ratio - LIMITS.borderRatio)).toBeLessThanOrEqual(LIMITS.borderTolerance);
    expect(Math.abs(mine.ratio - theirs.ratio)).toBeLessThanOrEqual(LIMITS.borderTolerance);
  });

  it('looks broadly similar overall', () => {
    const mismatched = pixelmatch(ours, ref, null, W, H, { threshold: 0.1 });
    expect(mismatched / (W * H)).toBeLessThanOrEqual(LIMITS.overall);
  });
});

describe('frame checks catch regressions', () => {
  it('detects a recoloured bar, a lighter border and a cut silhouette', async () => {
    const { ref } = await loadPair('jp');
    const svg = buildPennant(await loadFlagArtwork('jp'));
    const broken = async (from: string, to: string) => rgba(await renderPng(svg.replace(from, to)));

    expect(barMismatches(await broken('#d5b97a', '#c0c0c0'), ref)).toBeGreaterThan(0);
    const border = borderDarkening(await broken('stroke-opacity="0.3"', 'stroke-opacity="0.15"'));
    expect(Math.abs(border.ratio - LIMITS.borderRatio)).toBeGreaterThan(LIMITS.borderTolerance);
    const cut = await broken('V50L33 72L0 50Z"/></clipPath>', 'V60H0Z"/></clipPath>');
    expect(alphaDiff(cut, ref, 128).over).toBeGreaterThan(0);
  });
});

/**
 * rect / square / circle have no hand-made references, so their frames are
 * checked against the expected geometry: a white flag must come out white
 * inside, 30 % darker (255 * 0.7 ≈ 179) in the 2px border, transparent
 * outside the outline, and real flags must fill exactly the outline's
 * silhouette.
 */
describe.each(['rect', 'square', 'circle'] as const)('%s frame', (shape) => {
  const { width, height } = SHAPE_SIZE[shape];
  const white: FlagArt = {
    code: 'xx',
    viewBox: '0 0 4 3',
    content: '<path fill="#fff" d="M0 0h4v3H0z"/>',
  };
  let img: Buffer;
  const at = (x: number, y: number): number[] => [
    ...img.subarray((y * width + x) * 4, (y * width + x) * 4 + 4),
  ];
  beforeAll(async () => {
    img = await sharp(await renderPng(composeFlag(white, shape), 1, shape))
      .ensureAlpha()
      .raw()
      .toBuffer();
  });

  it('darkens the 2px inner border by 30% and leaves the inside untouched', () => {
    const midY = height >> 1;
    const midX = width >> 1;
    const inner = BORDER_WIDTH[shape] - 1; // last pixel inside the border
    for (const [x, y] of [
      [1, midY],
      [inner, midY],
      [width - 1 - inner, midY],
      [midX, inner],
      [midX, height - 1 - inner],
    ] as const) {
      const [r, g, b, a] = at(x, y);
      expect(a).toBe(255);
      for (const c of [r, g, b]) expect(Math.abs((c as number) - 179)).toBeLessThanOrEqual(4);
    }
    const clear = BORDER_WIDTH[shape] + 1; // first pixel clear of anti-aliasing
    for (const [x, y] of [
      [clear, midY],
      [midX, midY],
      [width - 1 - clear, midY],
      [midX, clear],
    ] as const) {
      expect(at(x, y)).toEqual([255, 255, 255, 255]);
    }
  });

  it('is transparent outside its outline', () => {
    const corner = at(0, 0)[3] as number;
    if (shape === 'circle') {
      expect(corner).toBe(0);
      expect(at(5, 5)[3]).toBe(0);
    } else {
      // corner radius 2: the very corner pixel is only partly covered
      expect(corner).toBeLessThan(160);
      expect(corner).toBeGreaterThan(0);
    }
  });

  // np is left out on purpose: Nepal's flag is not rectangular, so its artwork
  // is transparent outside the flag's own outline. That is faithful (the
  // pennant shows the same) rather than a frame defect.
  it.each(['ar', 'gb', 'br'])('fills exactly the outline with %s', async (code) => {
    const art = await loadFlagArtwork(code, undefined, undefined, SHAPE_ART[shape]);
    const flag = await rgba(await renderPng(composeFlag(art, shape), 1, shape));
    expect(alphaDiff(flag, img, 128).over).toBe(0);
  });
});
