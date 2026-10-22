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

/** Sanitizer signature (see `sanitize.ts`). */
export type Sanitize = (markup: string) => string | undefined;

/** Supplies the sanitizer: statically bundled or lazily imported. */
export type SanitizerSource = () => Sanitize | Promise<Sanitize>;

const requests = new Map<string, Promise<string>>();

function request(url: string, sanitizer: SanitizerSource): Promise<string> {
  let pending = requests.get(url);
  if (!pending) {
    pending = Promise.all([fetch(url), sanitizer()]).then(async ([response, sanitizeSvg]) => {
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
    });
    pending.catch(() => requests.delete(url)); // allow retries after a failure
    requests.set(url, pending);
  }
  return pending;
}

/** @internal Shared implementation; `sanitizer` decides static vs lazy loading. */
export async function fetchFlagSvg(
  code: string,
  options: FetchPennantOptions,
  sanitizer: SanitizerSource,
): Promise<string> {
  return request(pennantUrl(code, { ...options, format: 'svg' }), sanitizer);
}

/** Test helper: forgets every cached response. */
export function clearFetchCache(): void {
  requests.clear();
}
