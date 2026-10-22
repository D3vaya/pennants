import { fetchFlagSvg, type FetchPennantOptions, type SanitizerSource } from './fetch.ts';

/**
 * The sanitizer is only needed in fetch mode, so the root entry, React and
 * the element import it lazily (in parallel with the request): bundled-mode
 * apps never download it. `pennants/fetch` bundles it statically instead.
 */
const lazySanitizer: SanitizerSource = async () => (await import('./sanitize.ts')).sanitizeSvg;

/**
 * Fetches the SVG markup of one flag from static assets
 * (`<base>/svg/<shape>/<code>.svg`) instead of bundling it. Requests are cached and de-duplicated per URL. The
 * response is parsed with `DOMParser` and must be a single `<svg>` document
 * made only of allowlisted SVG elements and attributes (no scripts, event
 * handlers, `style`, external references or HTML); it is then re-serialised.
 * So a misconfigured or hostile `base` cannot inject markup. Browser-only:
 * without `DOMParser` (plain Node/SSR) it rejects; render on the server with
 * `loadFlag`/`renderFlag` instead. Rejects with a
 * `RangeError` for unknown codes or shapes.
 */
export async function fetchPennant(
  code: string,
  options: FetchPennantOptions = {},
): Promise<string> {
  return fetchFlagSvg(code, options, lazySanitizer);
}
