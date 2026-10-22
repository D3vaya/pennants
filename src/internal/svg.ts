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
 * Id prefix for one inlined instance: `pn<scope>-<code>-`. The scope (e.g.
 * React's `useId()` output such as `:r1:`, `«r1»` or `_R_1_`) is reduced to
 * `[A-Za-z0-9_]`, so the first `-` always separates scope from code and two
 * different (scope, code) pairs can never yield the same prefix. Keeping the
 * code matters because separate React roots (islands, several
 * `renderToString` calls) restart the `useId` sequence.
 */
export function scopedIdPrefix(scope: string, code: string): string {
  return `pn${scope.replace(/\W/g, '')}-${code}-`;
}

/**
 * Prepares pennant markup for inlining:
 * - the root `<svg>` fills its container (`width/height="100%"`) and is
 *   hidden from assistive tech (the wrapper carries the accessible name);
 * - when `scope` is given, the `pn-<code>-` id namespace (ids and every
 *   `url(#…)` / `href="#…"` reference) is rewritten to
 *   `scopedIdPrefix(scope, code)`, so two identical pennants on one page
 *   never share ids.
 */
export function prepareSvg(svg: string, scope?: string): string {
  let out = svg.replace(
    ROOT_TAG,
    (_match, lead: string, attrs: string) =>
      `${lead}<svg${attrs.replace(SIZE_ATTRS, '')} width="100%" height="100%" aria-hidden="true" focusable="false">`,
  );
  const code = scope === undefined ? undefined : svgCode(svg);
  if (code !== undefined && scope !== undefined) {
    out = out.split(`pn-${code}-`).join(scopedIdPrefix(scope, code));
  }
  return out;
}
