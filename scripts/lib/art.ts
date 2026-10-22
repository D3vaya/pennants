/**
 * Optimised flag artwork per set, at the lowest coordinate precision that
 * renders the same (see `pickPrecision`).
 */
import { composeFlag, type ArtSet, type FlagArt, type PennantShape } from '../../src/shapes.ts';
import { DEFAULT_PRECISION, optimizeFlag, readFlagSvg } from './flags.ts';
import { pickPrecision } from './precision.ts';

export const ART_SETS: readonly ArtSet[] = ['1x1', '4x3'];

/** Precision is judged in the shape that shows the most of each art set. */
export const PRECISION_SHAPE: Readonly<Record<ArtSet, PennantShape>> = {
  '1x1': 'square',
  '4x3': 'rect',
};

export async function buildFlagArt(code: string, set: ArtSet, root?: string): Promise<FlagArt> {
  const source = await readFlagSvg(code, root, set);
  const arts = new Map<number, FlagArt>();
  const optimize = (precision: number): FlagArt => {
    let art = arts.get(precision);
    if (!art) {
      art = optimizeFlag(code, source, precision);
      arts.set(precision, art);
    }
    return art;
  };
  const { precision } = await pickPrecision(
    (p) => composeFlag(optimize(p), PRECISION_SHAPE[set]),
    DEFAULT_PRECISION,
  );
  return optimize(precision);
}
