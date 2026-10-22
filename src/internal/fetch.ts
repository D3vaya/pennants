import type { PennantShape } from '../shapes.ts';
import { pennantUrl } from './core.ts';

/** Options of {@link fetchPennant}. */
export interface FetchPennantOptions {
  /**
   * Base URL where the package's `svg/` folder is served (see `pennantUrl`).
   * Defaults to the version-pinned jsDelivr CDN.
   */
  base?: string;
  /** Flag shape, `pennant` by default: fetches `<base>/svg/<shape>/<code>.svg`. */
  shape?: PennantShape;
}

const requests = new Map<string, Promise<string>>();

function request(url: string): Promise<string> {
  let pending = requests.get(url);
  if (!pending) {
    // The sanitizer is only needed in fetch mode: load it lazily, in parallel
    // with the request, so bundled-mode apps never download it.
    pending = Promise.all([fetch(url), import('./sanitize.ts')]).then(
      async ([response, { sanitizeSvg }]) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch pennant ${url}: HTTP ${response.status}`);
        }
        const svg = sanitizeSvg((await response.text()).trim());
        if (svg === undefined) {
          throw new TypeError(
            typeof DOMParser === 'undefined'
              ? 'fetchPennant needs DOMParser (a browser); use loadFlag/renderFlag on the server'
              : `Response from ${url} is not allowlisted pennant SVG markup`,
          );
        }
        return svg;
      },
    );
    pending.catch(() => requests.delete(url)); // allow retries after a failure
    requests.set(url, pending);
  }
  return pending;
}

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
  return request(pennantUrl(code, { ...options, format: 'svg' }));
}

/** Test helper: forgets every cached response. */
export function clearFetchCache(): void {
  requests.clear();
}
