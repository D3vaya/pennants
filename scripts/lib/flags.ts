import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { optimize, type CustomPlugin } from 'svgo';
import type { ArtSet } from '../../src/shapes.ts';
import { assertValidCode, unwrapSvg, type FlagArtwork } from './pennant.ts';

export interface FlagSource {
  code: string;
  name: string;
  /** `true` for ISO 3166-1 countries, `false` for regions/organisations. */
  iso: boolean;
}

interface FlagIconsCountry {
  code: string;
  name: string;
  iso: boolean;
}

const require = createRequire(import.meta.url);

/** Absolute path of the installed `flag-icons` package (source artwork, MIT). */
export function flagIconsRoot(): string {
  return dirname(require.resolve('flag-icons/package.json'));
}

export async function readFlagSources(root = flagIconsRoot()): Promise<FlagSource[]> {
  const raw = await readFile(join(root, 'country.json'), 'utf8');
  const countries = JSON.parse(raw) as FlagIconsCountry[];
  return countries
    .map(({ code, name, iso }) => ({ code: code.toLowerCase(), name, iso }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** svgo's default precision; used as the lossless reference. */
export const DEFAULT_PRECISION = 3;

/**
 * Style properties some source flags carry (Inkscape leftovers) that cannot
 * affect rendering here: text layout without `<text>`, `marker` without
 * markers, CSS `width` on paths. Presentation properties (fill, stroke…) are
 * turned into attributes first by `convertStyleToAttrs`.
 */
export const NO_OP_STYLE =
  /^(?:-inkscape-[\w-]+|line-height|text-[\w-]+|marker|width|font-[\w-]+)$/;

/**
 * Removes `style` attributes so inlined SVGs work under a CSP without
 * `style-src 'unsafe-inline'`. Fails the build on any property not known to
 * be a no-op, instead of silently changing a flag.
 */
export const dropNoOpStyles: CustomPlugin = {
  name: 'dropNoOpStyles',
  fn: () => ({
    element: {
      enter(node) {
        const style = node.attributes.style;
        if (style === undefined) return;
        for (const declaration of style.split(';')) {
          const property = declaration.split(':')[0]?.trim() ?? '';
          if (property && !NO_OP_STYLE.test(property)) {
            throw new Error(`Unexpected style property "${property}" in <${node.name}>`);
          }
        }
        delete node.attributes.style;
      },
    },
  }),
};

/**
 * Minifies a source flag and namespaces its ids so it can be embedded safely.
 * `precision` is the number of decimals kept in coordinates (see
 * `pickPrecision`: lower is smaller but can destroy tiny `<use>`-scaled shapes).
 */
export function optimizeFlag(
  code: string,
  svg: string,
  precision = DEFAULT_PRECISION,
): FlagArtwork {
  assertValidCode(code);
  const { data } = optimize(svg, {
    multipass: true,
    floatPrecision: precision,
    plugins: [
      { name: 'preset-default', params: { floatPrecision: precision } },
      'removeDimensions',
      'removeXlink',
      'convertStyleToAttrs',
      dropNoOpStyles,
      { name: 'prefixIds', params: { prefix: `pn-${code}`, delim: '-' } },
    ],
  });
  return { code, ...unwrapSvg(data) };
}

/** Raw source SVG of one flag from the square (`1x1`, default) or `4x3` artwork set. */
export async function readFlagSvg(
  code: string,
  root = flagIconsRoot(),
  set: ArtSet = '1x1',
): Promise<string> {
  assertValidCode(code);
  return readFile(join(root, 'flags', set, `${code}.svg`), 'utf8');
}

export async function loadFlagArtwork(
  code: string,
  root = flagIconsRoot(),
  precision = DEFAULT_PRECISION,
  set: ArtSet = '1x1',
): Promise<FlagArtwork> {
  return optimizeFlag(code, await readFlagSvg(code, root, set), precision);
}
