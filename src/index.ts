import { codes, isoCodes, type PennantCode } from './generated/codes.ts';
import { loaders } from './generated/loaders.ts';
import { englishNames } from './generated/names.ts';

export { codes, isoCodes, type PennantCode };

/** Intrinsic size of every pennant, in CSS pixels. */
export const PENNANT_WIDTH = 66;
export const PENNANT_HEIGHT = 72;
export const PENNANT_ASPECT_RATIO = PENNANT_WIDTH / PENNANT_HEIGHT;

const codeSet: ReadonlySet<string> = new Set(codes);

/** Type guard for supported flag codes. Accepts any casing (`AR`, `ar`, `Gb-Eng`). */
export function isPennantCode(value: unknown): value is PennantCode {
  return typeof value === 'string' && codeSet.has(value.toLowerCase());
}

/** Normalises user input to a `PennantCode`, throwing on unknown codes. */
export function toPennantCode(value: string): PennantCode {
  const code = value.trim().toLowerCase();
  if (!isPennantCode(code)) {
    throw new RangeError(`Unknown pennant code "${value}"`);
  }
  return code;
}

/**
 * Loads the SVG markup of one pennant. Each flag lives in its own chunk, so
 * only the flags you actually request are downloaded.
 */
export async function loadPennant(code: string): Promise<string> {
  const module = await loaders[toPennantCode(code)]();
  return module.default;
}

/**
 * Localised flag name. Uses `Intl.DisplayNames` for ISO 3166-1 regions and
 * falls back to the bundled English name (e.g. for `eu`, `gb-eng`).
 */
export function getPennantName(code: string, locale = 'en'): string {
  const normalized = toPennantCode(code);
  if (normalized.length === 2) {
    try {
      const name = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' }).of(
        normalized.toUpperCase(),
      );
      if (name) return name;
    } catch {
      // Invalid locale or region unsupported by this runtime: use bundled name.
    }
  }
  return englishNames[normalized];
}

/** Encodes SVG markup as a `data:` URI usable in `<img src>` or CSS `url()`. */
export function toDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface PennantUrlOptions {
  /** Base URL where the package's `svg/` (or `png/`) folder is served. */
  base?: string;
  format?: 'svg' | 'png';
  /** PNG density folder, only used when `format` is `png`. */
  scale?: 1 | 2;
}

/**
 * Builds the URL of a static pennant asset. Defaults to the jsDelivr CDN so
 * it works without any bundler configuration.
 */
export function pennantUrl(code: string, options: PennantUrlOptions = {}): string {
  const { base = 'https://cdn.jsdelivr.net/npm/pennants', format = 'svg', scale = 1 } = options;
  const root = base.replace(/\/+$/, '');
  const normalized = toPennantCode(code);
  return format === 'png'
    ? `${root}/png/${scale}x/${normalized}.png`
    : `${root}/svg/${normalized}.svg`;
}

/**
 * Converts an ISO 3166-1 alpha-2 code to its emoji flag (handy as a text
 * fallback). Returns an empty string for subdivision codes such as `gb-eng`.
 */
export function toEmoji(code: string): string {
  const normalized = toPennantCode(code);
  if (!/^[a-z]{2}$/.test(normalized)) return '';
  return String.fromCodePoint(
    ...[...normalized.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)),
  );
}
