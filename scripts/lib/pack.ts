/**
 * Install-size budget for the published package (`npm pack --dry-run`).
 */

/** Maximum unpacked size: users care about install weight (10 MB, decimal like npm). */
export const UNPACKED_BUDGET = 10_000_000;

export interface PackSummary {
  size: number;
  unpackedSize: number;
  entryCount: number;
}

/** Reads the summary from `npm pack --dry-run --json` output. */
export function parsePackJson(json: string): PackSummary {
  const [entry] = JSON.parse(json) as Partial<PackSummary>[];
  const { size, unpackedSize, entryCount } = entry ?? {};
  if (
    typeof size !== 'number' ||
    typeof unpackedSize !== 'number' ||
    typeof entryCount !== 'number'
  ) {
    throw new Error('Unexpected `npm pack --json` output');
  }
  return { size, unpackedSize, entryCount };
}

export const formatMB = (bytes: number): string => `${(bytes / 1e6).toFixed(2)} MB`;

/** One-line report; `ok` is false when the unpacked size exceeds `budget`. */
export function checkPackBudget(
  pack: PackSummary,
  budget = UNPACKED_BUDGET,
): { ok: boolean; message: string } {
  const ok = pack.unpackedSize <= budget;
  const message =
    `package ${formatMB(pack.size)}, unpacked ${formatMB(pack.unpackedSize)} ` +
    `(${pack.entryCount} files), budget ${formatMB(budget)}${ok ? '' : ' — OVER BUDGET'}`;
  return { ok, message };
}
