import { describe, expect, it } from 'vitest';
import { ART_SETS, buildFlagArt, PRECISION_SHAPE } from '../scripts/lib/art.ts';
import { SHAPE_ART } from '../src/shapes.ts';

describe('buildFlagArt', () => {
  it('covers both artwork sets, judged in a shape that uses them', () => {
    expect(ART_SETS).toEqual(['1x1', '4x3']);
    for (const set of ART_SETS) expect(SHAPE_ART[PRECISION_SHAPE[set]]).toBe(set);
  });

  it.each([
    ['1x1', '0 0 512 512'],
    ['4x3', '0 0 640 480'],
  ] as const)('reads the %s drawing', async (set, viewBox) => {
    const art = await buildFlagArt('jp', set);
    expect(art).toMatchObject({ code: 'jp', viewBox });
    expect(art.content).toContain('<circle');
  });

  it('keeps precision where rounding would break shapes (EU stars)', async () => {
    const art = await buildFlagArt('eu', '1x1');
    expect(art.content).toMatch(/\d\.\d/);
  });
});
