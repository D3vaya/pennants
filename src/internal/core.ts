/**
 * Loader-free core: everything here is pure data/string helpers, so importing
 * any of it never pulls the per-flag loader map (see `load.ts`).
 */
import { codes, isoCodes, type PennantCode } from '../generated/codes.ts';
import { extraNames } from '../generated/names.ts';
import { isShape, type PennantShape } from '../shapes.ts';

export { codes, isoCodes, type PennantCode };
export {
  SHAPES,
  SHAPE_ART,
  SHAPE_SIZE,
  isShape,
  type ArtSet,
  type FlagArt,
  type PennantShape,
} from '../shapes.ts';

/** Intrinsic width of every pennant, in CSS pixels (SVG `viewBox` units). */
export const PENNANT_WIDTH = 66;
/** Intrinsic height of every pennant, in CSS pixels (SVG `viewBox` units). */
export const PENNANT_HEIGHT = 72;
/** Width / height ratio of a pennant (66 / 72 ≈ 0.9167), e.g. for CSS `aspect-ratio`. */
export const PENNANT_ASPECT_RATIO = PENNANT_WIDTH / PENNANT_HEIGHT;

const codeSet: ReadonlySet<string> = /* @__PURE__ */ new Set(codes);
const isoCodeSet: ReadonlySet<string> = /* @__PURE__ */ new Set(isoCodes);

/** Injected at build time; versions the default CDN URL. */
declare const __PENNANTS_VERSION__: string;

/**
 * Default `base` of {@link pennantUrl} and `fetchPennant`: the jsDelivr CDN
 * pinned to this package version, e.g. `https://cdn.jsdelivr.net/npm/pennants@0.1.0`.
 */
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

/** Options of {@link pennantUrl}. */
export interface PennantUrlOptions {
  /** Base URL where the package's `svg/` (or `png/`) folder is served. */
  base?: string;
  /** Flag shape, `pennant` by default. Selects the `<shape>/` folder. */
  shape?: PennantShape;
  /**
   * Asset format: `svg` (default, `<base>/svg/<shape>/<code>.svg`) or `png`
   * (`<base>/png/<shape>/<scale>x/<code>.png`).
   */
  format?: 'svg' | 'png';
  /** PNG density folder, only used when `format` is `png`. */
  scale?: 1 | 2;
}

/** Validates a shape name, throwing a `RangeError` for anything else. */
export function toShape(value: unknown): PennantShape {
  if (!isShape(value)) throw new RangeError(`Unknown pennant shape "${String(value)}"`);
  return value;
}

/**
 * Builds the URL of a static flag asset. Defaults to the jsDelivr CDN,
 * pinned to this package version, so it works without bundler configuration.
 * Throws a `RangeError` for unknown codes or shapes.
 */
export function pennantUrl(code: string, options: PennantUrlOptions = {}): string {
  const { base = DEFAULT_CDN_BASE, format = 'svg', scale = 1, shape = 'pennant' } = options;
  const root = base.replace(/\/+$/, '');
  const normalized = toPennantCode(code);
  const folder = toShape(shape);
  return format === 'png'
    ? `${root}/png/${folder}/${scale}x/${normalized}.png`
    : `${root}/svg/${folder}/${normalized}.svg`;
}

/** Emoji flags that exist for non-ISO two-letter codes. */
const EXTRA_EMOJI: ReadonlySet<string> = /* @__PURE__ */ new Set(['eu', 'un']);

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
