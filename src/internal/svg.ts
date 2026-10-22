/**
 * Framework-agnostic helpers that prepare generated pennant markup for
 * inlining into a document. Pure string functions: safe on the server.
 */

const ROOT_TAG = /^(\s*)<svg\b([^>]*)>/;
const SIZE_ATTRS = /\s(?:width|height|aria-hidden|focusable)="[^"]*"/g;
const NAMESPACE = /\bid="pn-([a-z0-9-]+?)-clip"/;

/**
 * Returns the flag code whose `pn-<code>-` id namespace the markup uses
 * (every generated pennant defines `pn-<code>-clip`), or `undefined`.
 */
export function svgCode(svg: string): string | undefined {
  return NAMESPACE.exec(svg)?.[1];
}

/**
 * Turns an arbitrary unique token (e.g. React's `useId()` output such as
 * `:r1:` or `«r1»`) into a valid id prefix. The result never starts with
 * `pn-`, so it cannot collide with a pennant's own namespace.
 */
export function toIdPrefix(token: string): string {
  return `pn${token.replace(/[^\w-]/g, '')}-`;
}

/**
 * Prepares pennant markup for inlining:
 * - the root `<svg>` fills its container (`width/height="100%"`) and is
 *   hidden from assistive tech (the wrapper carries the accessible name);
 * - when `idPrefix` is given, the `pn-<code>-` id namespace (ids and every
 *   `url(#…)` / `href="#…"` reference) is rewritten to `idPrefix`, so two
 *   identical pennants on one page never share ids.
 */
export function prepareSvg(svg: string, idPrefix?: string): string {
  let out = svg.replace(
    ROOT_TAG,
    (_match, lead: string, attrs: string) =>
      `${lead}<svg${attrs.replace(SIZE_ATTRS, '')} width="100%" height="100%" aria-hidden="true" focusable="false">`,
  );
  const code = idPrefix === undefined ? undefined : svgCode(svg);
  if (code !== undefined && idPrefix !== undefined) {
    out = out.split(`pn-${code}-`).join(idPrefix);
  }
  return out;
}
