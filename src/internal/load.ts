import { loaders } from '../generated/loaders.ts';
import { toPennantCode } from './core.ts';

/**
 * Loads the SVG markup of one pennant. Each flag lives in its own chunk, so
 * only the flags you actually request are downloaded.
 */
export async function loadPennant(code: string): Promise<string> {
  const module = await loaders[toPennantCode(code)]();
  return module.default;
}
