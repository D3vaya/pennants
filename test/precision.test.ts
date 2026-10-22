import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PRECISION,
  optimizeFlag,
  readFlagSources,
  readFlagSvg,
} from '../scripts/lib/flags.ts';
import { buildPennant } from '../scripts/lib/pennant.ts';
import { MAX_STRONG_PIXELS, pickPrecision, strongDiff } from '../scripts/lib/precision.ts';
import { mapLimit } from '../scripts/lib/png.ts';
import { ART_SETS, PRECISION_SHAPE } from '../scripts/lib/art.ts';
import { composeFlag } from '../src/shapes.ts';

const build = (code: string, source: string) => (precision: number) =>
  buildPennant(optimizeFlag(code, source, precision));

describe('strongDiff', () => {
  it('is zero for identical artwork', async () => {
    const svg = build('jp', await readFlagSvg('jp'))(DEFAULT_PRECISION);
    expect(await strongDiff(svg, svg)).toBe(0);
  });

  it('detects a removed shape', async () => {
    const svg = build('jp', await readFlagSvg('jp'))(DEFAULT_PRECISION);
    expect(await strongDiff(svg.replace(/<circle[^>]*\/>/, ''), svg)).toBeGreaterThan(1000);
  });
});

describe('pickPrecision', () => {
  const fake = (precision: number) => 'x'.repeat(10 + precision);

  it('returns the first candidate within budget', async () => {
    const compare = vi.fn(async () => 0);
    expect(await pickPrecision(fake, 3, { compare })).toEqual({
      precision: 0,
      svg: fake(0),
      diff: 0,
    });
    expect(compare).toHaveBeenCalledTimes(1);
  });

  it('falls through candidates that change the render too much', async () => {
    const compare = vi.fn(async (svg: string) => (svg === fake(0) ? 500 : 3));
    expect(await pickPrecision(fake, 3, { compare })).toEqual({
      precision: 1,
      svg: fake(1),
      diff: 3,
    });
  });

  it('keeps the lossless output when nothing qualifies', async () => {
    const choice = await pickPrecision(fake, 3, { compare: async () => 1000 });
    expect(choice).toEqual({ precision: 3, svg: fake(3), diff: 0 });
  });

  it('skips candidates that are not smaller and stops at the lossless precision', async () => {
    const compare = vi.fn(async () => 0);
    const same = () => 'same';
    expect(await pickPrecision(same, 1, { compare })).toEqual({
      precision: 1,
      svg: 'same',
      diff: 0,
    });
    expect(compare).not.toHaveBeenCalled();
  });

  it('keeps EU stars intact (regression: rounding collapsed them)', async () => {
    const choice = await pickPrecision(build('eu', await readFlagSvg('eu')), DEFAULT_PRECISION);
    expect(choice.precision).toBeGreaterThan(0);
    expect(choice.svg).toContain('m0-1-.3 1 .5.1z');
  });
});

describe.each(ART_SETS)('generated %s artwork', (set) => {
  const shape = PRECISION_SHAPE[set];

  it(`renders like the lossless artwork for every flag (as ${shape})`, async () => {
    const sources = await readFlagSources();
    const failures = (
      await mapLimit(sources, 8, async ({ code }) => {
        const source = await readFlagSvg(code, undefined, set);
        const lossless = composeFlag(optimizeFlag(code, source, DEFAULT_PRECISION), shape);
        const generated = await readFile(
          new URL(`../svg/${shape}/${code}.svg`, import.meta.url),
          'utf8',
        );
        const diff = await strongDiff(generated, lossless);
        return diff > MAX_STRONG_PIXELS ? `${code}: ${diff}` : null;
      })
    ).filter(Boolean);
    expect(failures).toEqual([]);
  }, 60_000);
});
