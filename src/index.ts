import { codes, isoCodes, type PennantCode } from './generated/codes.ts';
import { loaders } from './generated/loaders.ts';
import { extraNames } from './generated/names.ts';

export { codes, isoCodes, type PennantCode };

/** Intrinsic size of every pennant, in CSS pixels. */
export const PENNANT_WIDTH = 66;
export const PENNANT_HEIGHT = 72;
export const PENNANT_ASPECT_RATIO = PENNANT_WIDTH / PENNANT_HEIGHT;

const codeSet: ReadonlySet<string> = new Set(codes);
const isoCodeSet: ReadonlySet<string> = new Set(isoCodes);

/** Injected at build time; versions the default CDN URL. */
declare const __PENNANTS_VERSION__: string;

export const DEFAULT_CDN_BASE = `https://cdn.jsdelivr.net/npm/pennants@${__PENNANTS_VERSION__}`;

/**
 * Exact type guard for supported flag codes (lowercase, e.g. `ar`, `gb-eng`).
 * Use `toPennantCode` to normalise user input such as `' AR '`.
 */
export function isPennantCode(value: unknown): value is PennantCode {
  return typeof value === 'string' && codeSet.has(value);
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

/** Region name from the runtime's CLDR data, or `undefined` if unavailable. */
function displayName(region: string, locale: string): string | undefined {
  try {
    return new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' }).of(region);
  } catch {
    // Invalid locale or Intl.DisplayNames missing in this runtime.
    return undefined;
  }
}

/**
 * Localised flag name. ISO 3166-1 names come from `Intl.DisplayNames` (no
 * bundled data); other flags (`gb-eng`, `asean`, ...) use a small bundled
 * English table. Falls back to the uppercase code as a last resort.
 */
export function getPennantName(code: string, locale = 'en'): string {
  const normalized = toPennantCode(code);
  const region = normalized.toUpperCase();
  const isRegion = normalized.length === 2;
  return (
    (isRegion ? (displayName(region, locale) ?? displayName(region, 'en')) : undefined) ??
    extraNames[normalized] ??
    region
  );
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
 * Builds the URL of a static pennant asset. Defaults to the jsDelivr CDN,
 * pinned to this package version, so it works without bundler configuration.
 */
export function pennantUrl(code: string, options: PennantUrlOptions = {}): string {
  const { base = DEFAULT_CDN_BASE, format = 'svg', scale = 1 } = options;
  const root = base.replace(/\/+$/, '');
  const normalized = toPennantCode(code);
  return format === 'png'
    ? `${root}/png/${scale}x/${normalized}.png`
    : `${root}/svg/${normalized}.svg`;
}

/** Emoji flags that exist for non-ISO two-letter codes. */
const EXTRA_EMOJI: ReadonlySet<string> = new Set(['eu', 'un']);

/**
 * Converts a code to its emoji flag (handy as a text fallback). Returns an
 * empty string when no emoji exists, e.g. for `gb-eng` or `xx`.
 */
export function toEmoji(code: string): string {
  const normalized = toPennantCode(code);
  if (!isoCodeSet.has(normalized) && !EXTRA_EMOJI.has(normalized)) return '';
  return String.fromCodePoint(
    ...[...normalized.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)),
  );
}
