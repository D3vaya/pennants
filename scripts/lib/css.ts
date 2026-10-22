/**
 * Stylesheets with a flag-icons-like API, one per shape, composable on one
 * page:
 *
 *   <span class="pn pn-ar"></span>         pennant   (css/pennant.css)
 *   <span class="pn-rect pn-ar"></span>    4:3 rect  (css/rect.css)
 *   <span class="pn-square pn-ar"></span>  square    (css/square.css)
 *   <span class="pn-circle pn-ar"></span>  circle    (css/circle.css)
 *
 * The base class is 1em tall and keeps the shape's aspect ratio, so it
 * scales with `font-size`. Flag rules are scoped to their base
 * (`.pn-circle.pn-ar`), so several stylesheets can load together; use one
 * base class per element. Size helpers (`.pn-lg`, `.pn-2x`…) work with all.
 */
import { BAR_CLASS, PENNANT, SHAPE_SIZE, type PennantShape } from '../../src/shapes.ts';
import { assertValidCode } from './pennant.ts';

/** Size helpers, font-awesome style: multiply the inherited font-size. */
export const SIZES: Readonly<Record<string, string>> = {
  lg: '1.3333em',
  '2x': '2em',
  '3x': '3em',
  '4x': '4em',
};

export interface CssOptions {
  /** Shape the stylesheet is for. Defaults to `pennant`. */
  shape?: PennantShape;
  /** URL of the shape's SVG directory. Defaults to `../svg/<shape>` (relative to `css/`). */
  svgPath?: string;
}

/** Base class of each shape's stylesheet. */
export const SHAPE_CLASS: Readonly<Record<PennantShape, string>> = {
  pennant: 'pn',
  rect: 'pn-rect',
  square: 'pn-square',
  circle: 'pn-circle',
};

const HEADER =
  '/*! pennants — country flags in pennant style. MIT. Artwork from flag-icons (MIT). */\n';

export function baseRule(shape: PennantShape = 'pennant'): string {
  const { width, height } = SHAPE_SIZE[shape];
  const cssWidth = width === height ? '1em' : `calc(${width}/${height}*1em)`;
  return (
    `.${SHAPE_CLASS[shape]} {\n` +
    `  display: inline-block;\n` +
    `  position: relative;\n` +
    `  width: ${cssWidth};\n` +
    `  height: 1em;\n` +
    `  line-height: 1em;\n` +
    `  vertical-align: middle;\n` +
    `  background-size: contain;\n` +
    `  background-position: center;\n` +
    `  background-repeat: no-repeat;\n` +
    `}\n`
  );
}

export function sizeRules(): string {
  return Object.entries(SIZES)
    .map(([name, size]) => `.pn-${name} {\n  font-size: ${size};\n}\n`)
    .join('');
}

/**
 * Theming rules for *inlined* pennant SVGs (React, web component, sprite
 * copied into the page). Stylesheet rules beat the gold `stop-color`
 * attributes, so `--pennant-bar-light` / `--pennant-bar-dark` recolour the
 * bar without inline styles (CSP-safe). SVGs used as images or backgrounds
 * can't be styled from the page and always stay gold.
 */
export function themeCss(): string {
  const { light, dark } = BAR_CLASS;
  return (
    `.${light} {\n  stop-color: var(--pennant-bar-light, ${PENNANT.barLight});\n}\n` +
    `.${dark} {\n  stop-color: var(--pennant-bar-dark, ${PENNANT.barDark});\n}\n`
  );
}

/** Background rule of one flag, scoped to the shape's base class. */
export function flagRule(
  code: string,
  svgPath = '../svg/pennant',
  shape: PennantShape = 'pennant',
): string {
  assertValidCode(code);
  return `.${SHAPE_CLASS[shape]}.pn-${code} {\n  background-image: url(${svgPath}/${code}.svg);\n}\n`;
}

/**
 * Full, readable stylesheet of one shape (`css/<shape>.css`). Only the
 * pennant has a bar, so only its stylesheet carries the theming rules.
 */
export function pennantsCss(
  codes: readonly string[],
  { shape = 'pennant', svgPath = `../svg/${shape}` }: CssOptions = {},
): string {
  return [
    HEADER + baseRule(shape),
    sizeRules(),
    ...(shape === 'pennant' ? [themeCss()] : []),
    ...codes.map((code) => flagRule(code, svgPath, shape)),
  ].join('\n');
}

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * Version-pinned jsDelivr URL of the `svg/` directory, for
 * `css/pennants.cdn.min.css`. Absolute URLs are left alone by bundlers
 * (Vite, SvelteKit, Astro…), which otherwise inline every referenced SVG
 * under their size limit as a data URI and blow the stylesheet up ~25x.
 */
export function cdnSvgPath(version: string, shape: PennantShape = 'pennant'): string {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid package version "${version}"`);
  }
  return `https://cdn.jsdelivr.net/npm/pennants@${version}/svg/${shape}`;
}

/**
 * Declaration for the stylesheet subpaths so `import 'pennants/css'`
 * type-checks under `noUncheckedSideEffectImports` (default in TS 6).
 */
export function cssDeclaration(): string {
  return '// Side-effect-only stylesheet import; nothing is exported.\nexport {};\n';
}

/**
 * Tiny minifier for the stylesheet generated above — not a general CSS
 * minifier: it drops non-`/*!` comments, whitespace and the last `;` of each
 * block. Only spaces next to `{}:;,` are removed and other whitespace runs
 * collapse to one space, so values that need spaces (e.g. `+`/`-` inside
 * `calc()`) survive. Selectors with descendant combinators next to a `:`
 * (`.a :hover`) would break, which is why this is only used on our own CSS.
 */
export function minifyCss(css: string): string {
  return css
    .replace(/\/\*(?!!)[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\*\/ ?/g, '*/\n')
    .trim()
    .concat('\n');
}
