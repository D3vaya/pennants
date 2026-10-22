import { loaders } from '../generated/loaders-1x1.ts';
import type { FlagArt } from '../shapes.ts';
import { toPennantCode } from './core.ts';

/** Loads `1x1` artwork (pennant, square, circle). One chunk per flag. */
export async function loadArt1x1(code: string): Promise<FlagArt> {
  return (await loaders[toPennantCode(code)]()).default;
}
