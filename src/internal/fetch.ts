import { pennantUrl } from './core.ts';

/** Options of {@link fetchPennant}. */
export interface FetchPennantOptions {
  /**
   * Base URL where the package's `svg/` folder is served (see `pennantUrl`).
   * Defaults to the version-pinned jsDelivr CDN.
   */
  base?: string;
}

/** Markup that could run script once inlined: never valid in a pennant. */
const UNSAFE = /<script|<foreignObject|<iframe|\son[a-z]+\s*=|javascript:/i;

const requests = new Map<string, Promise<string>>();

function request(url: string): Promise<string> {
  let pending = requests.get(url);
  if (!pending) {
    pending = fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch pennant ${url}: HTTP ${response.status}`);
      }
      const svg = (await response.text()).trim();
      if (!svg.startsWith('<svg') || !svg.endsWith('</svg>') || UNSAFE.test(svg)) {
        throw new TypeError(`Response from ${url} is not pennant SVG markup`);
      }
      return svg;
    });
    pending.catch(() => requests.delete(url)); // allow retries after a failure
    requests.set(url, pending);
  }
  return pending;
}

/**
 * Fetches the SVG markup of one pennant from static assets (`<base>/svg/<code>.svg`)
 * instead of bundling it. Requests are cached and de-duplicated per URL. The
 * response must be a successful, script-free `<svg>…</svg>` document, so a
 * misconfigured `base` cannot inject arbitrary HTML. Rejects with a
 * `RangeError` for unknown codes.
 */
export async function fetchPennant(
  code: string,
  options: FetchPennantOptions = {},
): Promise<string> {
  return request(pennantUrl(code, options.base === undefined ? {} : { base: options.base }));
}

/** Test helper: forgets every cached response. */
export function clearFetchCache(): void {
  requests.clear();
}
