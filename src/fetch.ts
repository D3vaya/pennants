/**
 * `pennants/fetch`: fetch-mode loading without the bundled per-flag loader map.
 * The SVG sanitizer is bundled statically here (one request, no lazy-chunk
 * helper); the root entry, React and the element load it lazily instead.
 */
import { fetchFlagSvg, type FetchPennantOptions } from './internal/fetch.ts';
import { sanitizeSvg } from './internal/sanitize.ts';

export type { FetchPennantOptions };
export { DEFAULT_CDN_BASE, pennantUrl } from './internal/core.ts';

/**
 * Fetches the SVG markup of one flag from static assets
 * (`<base>/svg/<shape>/<code>.svg`) instead of bundling it. Same contract as
 * the root `fetchPennant`: cached and de-duplicated per URL, parsed with
 * `DOMParser` and accepted only as a single allowlisted `<svg>` document
 * (re-serialised), browser-only (rejects without `DOMParser`), `RangeError`
 * for unknown codes or shapes.
 */
export async function fetchPennant(
  code: string,
  options: FetchPennantOptions = {},
): Promise<string> {
  return fetchFlagSvg(code, options, () => sanitizeSvg);
}
