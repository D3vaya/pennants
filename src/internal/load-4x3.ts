import { loaders } from '../generated/loaders-4x3.ts';
import type { FlagArt } from '../shapes.ts';
import { toPennantCode } from './core.ts';

/** Loads `4x3` artwork (rect). One chunk per flag. */
export async function loadArt4x3(code: string): Promise<FlagArt> {
  return (await loaders[toPennantCode(code)]()).default;
}
