/**
 * Stylesheet with a flag-icons-like API:
 *
 *   <span class="pn pn-ar"></span>
 *
 * `.pn` is 1em tall and keeps the 66:72 pennant ratio, so it scales with
 * `font-size`; `.pn-<code>` only sets the background image.
 */
import { assertValidCode, PENNANT } from './pennant.ts';

/** Size helpers, font-awesome style: multiply the inherited font-size. */
export const SIZES: Readonly<Record<string, string>> = {
  lg: '1.3333em',
  '2x': '2em',
  '3x': '3em',
  '4x': '4em',
};

export interface CssOptions {
  /** URL of the `svg/` directory relative to the stylesheet. Defaults to `../svg`. */
  svgPath?: string;
}

const HEADER =
  '/*! pennants — country flags in pennant style. MIT. Artwork from flag-icons (MIT). */\n';

export function baseRule(): string {
  return (
    `.pn {\n` +
    `  display: inline-block;\n` +
    `  position: relative;\n` +
    `  width: calc(${PENNANT.width}/${PENNANT.height}*1em);\n` +
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

export function flagRule(code: string, svgPath = '../svg'): string {
  assertValidCode(code);
  return `.pn-${code} {\n  background-image: url(${svgPath}/${code}.svg);\n}\n`;
}

/** Full, readable stylesheet (`css/pennants.css`). */
export function pennantsCss(codes: readonly string[], { svgPath }: CssOptions = {}): string {
  return [HEADER + baseRule(), sizeRules(), ...codes.map((code) => flagRule(code, svgPath))].join(
    '\n',
  );
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
