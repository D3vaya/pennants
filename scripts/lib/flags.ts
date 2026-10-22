import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { optimize } from 'svgo';
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

/** Minifies a source flag and namespaces its ids so it can be embedded safely. */
export function optimizeFlag(code: string, svg: string): FlagArtwork {
  assertValidCode(code);
  const { data } = optimize(svg, {
    multipass: true,
    plugins: [
      'preset-default',
      'removeDimensions',
      'removeXlink',
      { name: 'prefixIds', params: { prefix: `pn-${code}`, delim: '-' } },
    ],
  });
  return { code, ...unwrapSvg(data) };
}

export async function loadFlagArtwork(code: string, root = flagIconsRoot()): Promise<FlagArtwork> {
  const svg = await readFile(join(root, 'flags', '1x1', `${code}.svg`), 'utf8');
  return optimizeFlag(code, svg);
}
