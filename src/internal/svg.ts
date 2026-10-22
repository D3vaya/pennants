/**
 * Framework-agnostic helpers that prepare generated pennant markup for
 * inlining into a document. Pure string functions: safe on the server.
 */

import { composeFlag, type PennantShape } from '../shapes.ts';
import type { CachedFlag } from './cache.ts';

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
 * Id prefix for one inlined instance: `pn<scope>-<namespace>-`, where the
 * namespace is the flag code plus, for non-pennant shapes, the shape
 * (`ar`, `ar-circle`). The scope (e.g. React's `useId()` output such as
 * `:r1:`, `«r1»` or `_R_1_`) is reduced to `[A-Za-z0-9_]`, so the first `-`
 * always separates scope from namespace and two different pairs never yield
 * the same prefix. Keeping code and shape matters because separate React
 * roots (islands, several `renderToString` calls) restart the `useId` sequence.
 */
export function scopedIdPrefix(scope: string, namespace: string): string {
  return `pn${scope.replace(/\W/g, '')}-${namespace}-`;
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

/**
 * Inline markup for a cached flag: composes bundled artwork in `shape` (or
 * takes fetched markup as is), makes it fluid and, when `scope` is given,
 * gives its ids a per-instance namespace.
 */
export function inlineFlag(flag: CachedFlag, shape: PennantShape, scope?: string): string {
  if (typeof flag === 'string') return prepareSvg(flag, scope);
  // The shape is part of the namespace: the same flag in two shapes (or in
  // two React roots whose useId sequences coincide) never shares ids.
  const namespace = shape === 'pennant' ? flag.code : `${flag.code}-${shape}`;
  const prefix = scope === undefined ? undefined : scopedIdPrefix(scope, namespace);
  return prepareSvg(composeFlag(flag, shape, prefix));
}

/** Root `viewBox` and inner markup of an SVG document. */
export interface SvgParts {
  viewBox: string;
  inner: string;
}

const DOCUMENT = /^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/;
const VIEW_BOX = /\bviewBox="([^"]*)"/;

/** Splits SVG markup into its root `viewBox` and children markup. */
export function splitSvg(markup: string): SvgParts {
  const match = DOCUMENT.exec(markup);
  return {
    viewBox: VIEW_BOX.exec(match?.[1] ?? '')?.[1] ?? '',
    inner: match?.[2] ?? '',
  };
}

/**
 * Like {@link inlineFlag}, but returns the parts a framework renders itself:
 * the root element's attributes stay under the framework's control (sizing via
 * presentation attributes, no inline `style`), only the children are raw HTML.
 */
export function inlineParts(flag: CachedFlag, shape: PennantShape, scope?: string): SvgParts {
  return splitSvg(inlineFlag(flag, shape, scope));
}
