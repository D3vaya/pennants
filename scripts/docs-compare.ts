/**
 * Measures pennants against flag-icons and country-flag-icons for the docs
 * comparison page. Prints a markdown table (or JSON with --json).
 *
 *   npm run build && node scripts/docs-compare.ts [--json]
 *
 * pennants is measured from the local build (svg/<shape>/, css/, dist/art/); the other
 * packages are downloaded with `npm pack` at the pinned versions below, so the
 * numbers are reproducible. Compressed sizes are the sum over individual files
 * (each file is served on its own), with Node's zlib: brotli quality 11, gzip level 9.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const flagIconsVersion = (
  JSON.parse(readFileSync(join(root, 'node_modules/flag-icons/package.json'), 'utf8')) as {
    version: string;
  }
).version;
const countryFlagIconsVersion = '1.6.20';

interface Size {
  files: number;
  raw: number;
  gzip: number;
  brotli: number;
}

function measure(paths: string[]): Size {
  let raw = 0;
  let gzip = 0;
  let brotli = 0;
  for (const path of paths) {
    const data = readFileSync(path);
    raw += data.length;
    gzip += gzipSync(data, { level: 9 }).length;
    brotli += brotliCompressSync(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
  }
  return { files: paths.length, raw, gzip, brotli };
}

function median(paths: string[]): number {
  const sizes = paths.map((path) => measure([path]).brotli).sort((a, b) => a - b);
  return sizes[Math.floor(sizes.length / 2)] ?? 0;
}

const svgsIn = (dir: string): string[] =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.svg'))
    .map((file) => join(dir, file));

function dirSize(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(path) : statSync(path).size;
  }
  return total;
}

/** Downloads and extracts a published package; returns its folder and tarball size. */
function fetchPackage(spec: string, into: string): { dir: string; tarball: number } {
  const output = execFileSync('npm', ['pack', spec, '--silent', '--pack-destination', into], {
    encoding: 'utf8',
  });
  const tarball = join(into, output.trim().split('\n').pop() ?? '');
  const dir = join(into, spec.replace(/[^a-z0-9.-]/gi, '_'));
  execFileSync('mkdir', ['-p', dir]);
  execFileSync('tar', ['xzf', tarball, '-C', dir]);
  return { dir: join(dir, 'package'), tarball: statSync(tarball).size };
}

for (const required of ['svg/pennant', 'svg/rect', 'css/pennant.min.css', 'dist/art/1x1/ar.js']) {
  if (!existsSync(join(root, required))) {
    console.error(`Missing ${required}. Run \`npm run build\` first.`);
    process.exit(1);
  }
}

const work = mkdtempSync(join(tmpdir(), 'pennants-compare-'));
try {
  const flagIcons = fetchPackage(`flag-icons@${flagIconsVersion}`, work);
  const countryFlagIcons = fetchPackage(`country-flag-icons@${countryFlagIconsVersion}`, work);
  const pack = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: root,
      encoding: 'utf8',
    }),
  ) as { size: number; unpackedSize: number }[];

  const pennantsSvgs = svgsIn(join(root, 'svg/pennant'));
  const pennantsRects = svgsIn(join(root, 'svg/rect'));
  const flagIconsSvgs = svgsIn(join(flagIcons.dir, 'flags/4x3'));
  const flagIconsSquare = svgsIn(join(flagIcons.dir, 'flags/1x1'));
  const cfiSvgs = svgsIn(join(countryFlagIcons.dir, '3x2'));

  const results = {
    versions: {
      pennants: (
        JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
      ).version,
      'flag-icons': flagIconsVersion,
      'country-flag-icons': countryFlagIconsVersion,
    },
    flags: {
      pennants: pennantsSvgs.length,
      'flag-icons': flagIconsSvgs.length,
      'country-flag-icons': cfiSvgs.length,
    },
    allSvgs: {
      'pennants (pennant)': measure(pennantsSvgs),
      'pennants (rect 4:3)': measure(pennantsRects),
      'flag-icons (4x3)': measure(flagIconsSvgs),
      'flag-icons (1x1)': measure(flagIconsSquare),
      'country-flag-icons (3x2)': measure(cfiSvgs),
    },
    medianSvgBrotli: {
      'pennants (pennant)': median(pennantsSvgs),
      'pennants (rect 4:3)': median(pennantsRects),
      'flag-icons (4x3)': median(flagIconsSvgs),
      'country-flag-icons (3x2)': median(cfiSvgs),
    },
    css: {
      'pennants (pennant)': measure([join(root, 'css/pennant.min.css')]),
      'pennants (rect)': measure([join(root, 'css/rect.min.css')]),
      'flag-icons': measure([join(flagIcons.dir, 'css/flag-icons.min.css')]),
      'country-flag-icons': measure([join(countryFlagIcons.dir, '3x2/flags.css')]),
    },
    oneFlagModule: {
      'pennants (art/1x1/ar)': measure([join(root, 'dist/art/1x1/ar.js')]),
      'country-flag-icons': measure([join(countryFlagIcons.dir, 'string/3x2/AR.js')]),
    },
    tarball: {
      pennants: { packed: pack[0]?.size ?? 0, unpacked: pack[0]?.unpackedSize ?? 0 },
      'flag-icons': { packed: flagIcons.tarball, unpacked: dirSize(flagIcons.dir) },
      'country-flag-icons': {
        packed: countryFlagIcons.tarball,
        unpacked: dirSize(countryFlagIcons.dir),
      },
    },
  };

  if (process.argv.includes('--json')) {
    console.info(JSON.stringify(results, null, 2));
  } else {
    const kb = (bytes: number): string =>
      bytes >= 1_000_000
        ? `${(bytes / 1_000_000).toFixed(2)} MB`
        : `${(bytes / 1000).toFixed(1)} kB`;
    const size = (s: Size): string => `${kb(s.raw)} / ${kb(s.gzip)} / ${kb(s.brotli)}`;
    const rows: string[] = [
      `Versions: ${Object.entries(results.versions)
        .map(([name, version]) => `${name} ${version}`)
        .join(', ')}`,
      '',
      '| Metric | Package | Value |',
      '| ------ | ------- | ----- |',
      ...Object.entries(results.flags).map(([name, n]) => `| Flags (SVG files) | ${name} | ${n} |`),
      ...Object.entries(results.allSvgs).map(
        ([name, s]) => `| All SVGs, raw / gzip / brotli | ${name} | ${size(s)} |`,
      ),
      ...Object.entries(results.medianSvgBrotli).map(
        ([name, n]) => `| Median SVG, brotli | ${name} | ${n} B |`,
      ),
      ...Object.entries(results.css).map(
        ([name, s]) => `| Full CSS, raw / gzip / brotli | ${name} | ${size(s)} |`,
      ),
      ...Object.entries(results.oneFlagModule).map(
        ([name, s]) =>
          `| One flag string module (ar), raw / gzip / brotli | ${name} | ${size(s)} |`,
      ),
      ...Object.entries(results.tarball).map(
        ([name, t]) =>
          `| npm tarball, packed / unpacked | ${name} | ${kb(t.packed)} / ${kb(t.unpacked)} |`,
      ),
    ];
    console.info(rows.join('\n'));
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
