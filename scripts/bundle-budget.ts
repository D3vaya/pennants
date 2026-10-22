/**
 * Real-bundler weight gate. Builds minimal Vite probes against the packed
 * tarball, measures the JS/CSS a page loads up front (minified, gzip,
 * brotli) relative to an empty app (a delta, so the baseline rows are absolute), prints a markdown table and fails when a
 * probe exceeds its budget in scripts/bundle-budget.json.
 *
 *   node scripts/bundle-budget.ts              # build, pack, measure, check
 *   node scripts/bundle-budget.ts --no-build   # reuse the current build
 *   node scripts/bundle-budget.ts --update     # rewrite budgets from this run (+5%)
 *   node scripts/bundle-budget.ts --keep       # keep the temp dir
 *   node scripts/bundle-budget.ts --json out.json  # also write the measurements as JSON
 *   node scripts/bundle-budget.ts --check-snapshot docs/data/bundle-sizes.json
 *     # also fail when that committed snapshot drifted from this run (> 2% and > 50 B)
 */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

type Baseline = 'empty' | 'react';

interface Probe {
  name: string;
  label: string;
  /** Baseline the delta is computed against (the baselines themselves have none). */
  baseline?: Baseline;
  main: string;
  /** Extra vite.config.js source. */
  config?: string;
  /** API not in every version: without a budget entry, a failed build is reported as n/a. */
  optional?: boolean;
}

const METRICS = ['jsMin', 'jsGzip', 'jsBrotli', 'cssMin', 'cssGzip', 'cssBrotli', 'lazyFiles'];
type Metric = (typeof METRICS)[number];
type Sizes = Record<Metric, number>;
type Budgets = Record<string, Partial<Sizes>>;

const root = resolve(import.meta.dirname, '..');
const budgetPath = join(root, 'scripts', 'bundle-budget.json');

const react = (element: string, imports: string): string =>
  `import { createRoot } from 'react-dom/client';\nimport { jsx } from 'react/jsx-runtime';\n${imports}\n` +
  `createRoot(document.getElementById('app')).render(${element});`;

const NO_INLINE = `export default {
  build: { assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined) },
};`;

const SHAPES = ['pennant', 'rect', 'square', 'circle'] as const;
const artFor = (shape: string): string => (shape === 'rect' ? '4x3' : '1x1');

const cssProbe = (shape: string, cdn: boolean): Probe => {
  const path = `pennants/css${shape === 'pennant' ? '' : `/${shape}`}${cdn ? '/cdn' : ''}`;
  return {
    name: `css${shape === 'pennant' ? '' : `-${shape}`}${cdn ? '-cdn' : ''}`,
    label: `CSS \`${path}\`${cdn ? '' : ', `assetsInlineLimit` set'}`,
    baseline: 'empty',
    ...(cdn ? {} : { config: NO_INLINE }),
    main: `import '${path}';\ndocument.body.innerHTML = '<span class="pn pn-ar"></span>';`,
  };
};

const PROBES: Probe[] = [
  { name: 'empty', label: 'Empty app (baseline)', main: `document.body.append('ready');` },
  { name: 'react', label: 'Empty React app (baseline)', main: react(`jsx('b', {})`, '') },
  ...SHAPES.map((shape): Probe => ({
    name: `art-${shape}`,
    label: `\`pennants/art/${artFor(shape)}/ar\` + \`renderFlag\` (${shape})`,
    baseline: 'empty',
    main:
      `import ar from 'pennants/art/${artFor(shape)}/ar';\nimport { renderFlag } from 'pennants';\n` +
      `document.body.innerHTML = renderFlag(ar, { shape: '${shape}' });`,
  })),
  {
    name: 'art-all',
    label: 'Both `ar` art sets + `renderFlag` (all four shapes)',
    baseline: 'empty',
    main:
      `import ar from 'pennants/art/1x1/ar';\nimport ar4x3 from 'pennants/art/4x3/ar';\n` +
      `import { renderFlag } from 'pennants';\n` +
      `document.body.innerHTML = ['pennant', 'square', 'circle'].map((shape) => renderFlag(ar, { shape })).join('') + renderFlag(ar4x3, { shape: 'rect' });`,
  },
  {
    name: 'name',
    label: '`getPennantName`',
    baseline: 'empty',
    main: `import { getPennantName } from 'pennants';\ndocument.body.append(getPennantName('ar', 'es'));`,
  },
  {
    name: 'url',
    label: '`pennantUrl`',
    baseline: 'empty',
    main: `import { pennantUrl } from 'pennants';\ndocument.body.append(pennantUrl('ar', { shape: 'circle' }));`,
  },
  {
    name: 'load',
    label: '`loadPennant`',
    baseline: 'empty',
    main: `import { loadPennant } from 'pennants';\nloadPennant('ar').then((svg) => (document.body.innerHTML = svg));`,
  },
  {
    name: 'load-shapes',
    label: '`loadFlag`, circle + rect',
    baseline: 'empty',
    main:
      `import { loadFlag } from 'pennants';\n` +
      `Promise.all([loadFlag('ar', { shape: 'circle' }), loadFlag('ar', { shape: 'rect' })])` +
      `.then((svgs) => (document.body.innerHTML = svgs.join('')));`,
  },
  {
    name: 'fetch',
    label: '`fetchPennant` (`pennants/fetch`)',
    baseline: 'empty',
    main: `import { fetchPennant } from 'pennants/fetch';\nfetchPennant('ar', { shape: 'circle' }).then((svg) => (document.body.innerHTML = svg));`,
  },
  {
    name: 'element',
    label: '`pennants/element/register`',
    baseline: 'empty',
    main: `import 'pennants/element/register';\ndocument.body.innerHTML = '<pennant-flag code="ar" shape="circle"></pennant-flag>';`,
  },
  {
    name: 'react-pennant',
    label: 'React `<Pennant>`',
    baseline: 'react',
    main: react(`jsx(Pennant, { code: 'ar' })`, `import { Pennant } from 'pennants/react';`),
  },
  {
    name: 'react-pennant-circle',
    label: 'React `<Pennant shape="circle">`',
    baseline: 'react',
    main: react(
      `jsx(Pennant, { code: 'ar', shape: 'circle' })`,
      `import { Pennant } from 'pennants/react';`,
    ),
  },
  {
    name: 'react-svg',
    label: 'React `<PennantSvg>` + one art module',
    baseline: 'react',
    main: react(
      `jsx(PennantSvg, { art: ar })`,
      `import { PennantSvg } from 'pennants/react';\nimport ar from 'pennants/art/1x1/ar';`,
    ),
  },
  {
    name: 'react-svg-circle',
    label: 'React `<PennantSvg shape="circle">` + one art module',
    baseline: 'react',
    main: react(
      `jsx(PennantSvg, { art: ar, shape: 'circle' })`,
      `import { PennantSvg } from 'pennants/react';\nimport ar from 'pennants/art/1x1/ar';`,
    ),
  },
  ...SHAPES.flatMap((shape) => [cssProbe(shape, false), cssProbe(shape, true)]),
  {
    name: 'css-mixed',
    label: 'CSS `pennants/css` + `pennants/css/circle` on one page, `assetsInlineLimit` set',
    baseline: 'empty',
    config: NO_INLINE,
    main:
      `import 'pennants/css';\nimport 'pennants/css/circle';\n` +
      `document.body.innerHTML = '<span class="pn pn-ar"></span><span class="pn-circle pn-ar"></span>';`,
  },
  {
    name: 'css-default',
    label: 'CSS `pennants/css`, Vite defaults (inlined flags)',
    baseline: 'empty',
    main: `import 'pennants/css';\ndocument.body.innerHTML = '<span class="pn pn-ar"></span>';`,
  },
];

const argv = process.argv.slice(2);
const args = new Set(argv);
/** Value of a `--flag <path>` option, if given. */
function pathOption(flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a file path`);
  return value;
}
const jsonPath = pathOption('--json');
const snapshotPath = pathOption('--check-snapshot');

interface Triple {
  min: number;
  gzip: number;
  brotli: number;
}
interface ProbeRecord {
  label: string;
  baseline: Baseline | null;
  entry: Triple;
  css: Triple | null;
  lazyFiles: number;
}

function run(command: string, commandArgs: string[], cwd: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, { cwd, shell: process.platform === 'win32' });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise(output);
      else {
        const tail = output.trim().split('\n').slice(-20).join('\n');
        reject(new Error(`\`${command} ${commandArgs.join(' ')}\` exited with ${code}\n${tail}`));
      }
    });
  });
}

const gzip = (data: Buffer): number => gzipSync(data, { level: 9 }).length;
const brotli = (data: Buffer): number =>
  brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

/** Sizes of the files `index.html` loads up front, plus the number of lazy JS files. */
async function measure(outDir: string): Promise<Sizes> {
  const html = await readFile(join(outDir, 'index.html'), 'utf8');
  const initial = new Set(
    [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1] ?? ''),
  );
  const sizes: Sizes = Object.fromEntries(METRICS.map((metric) => [metric, 0]));
  for (const file of await readdir(join(outDir, 'assets'))) {
    const path = `assets/${file}`;
    const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : undefined;
    if (kind === undefined) continue;
    if (!initial.has(path)) {
      if (kind === 'js') sizes.lazyFiles = (sizes.lazyFiles ?? 0) + 1;
      continue;
    }
    const data = await readFile(join(outDir, path));
    sizes[`${kind}Min`] = (sizes[`${kind}Min`] ?? 0) + data.length;
    sizes[`${kind}Gzip`] = (sizes[`${kind}Gzip`] ?? 0) + gzip(data);
    sizes[`${kind}Brotli`] = (sizes[`${kind}Brotli`] ?? 0) + brotli(data);
  }
  return sizes;
}

async function build(probe: Probe, workDir: string): Promise<Sizes> {
  const dir = join(workDir, 'probes', probe.name);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, 'index.html'),
    '<!doctype html><div id="app"></div><script type="module" src="./main.js"></script>\n',
  );
  await writeFile(join(dir, 'main.js'), `${probe.main}\n`);
  const config = join(dir, 'vite.config.js');
  await writeFile(config, probe.config ?? 'export default {};\n');
  const outDir = join(workDir, 'out', probe.name);
  await run(
    'npx',
    [
      'vite',
      'build',
      dir,
      '--config',
      config,
      '--outDir',
      outDir,
      '--emptyOutDir',
      '--logLevel',
      'error',
    ],
    workDir,
  );
  return measure(outDir);
}

const kB = (bytes: number, signed = true): string => {
  const sign = !signed ? '' : bytes > 0 ? '+' : bytes < 0 ? '−' : '';
  const abs = Math.abs(bytes);
  return abs < 1000 ? `${sign}${abs} B` : `${sign}${(abs / 1000).toFixed(1)} kB`;
};

const workDir = await mkdtemp(join(tmpdir(), 'pennants-budget-'));
if (!args.has('--no-build')) await run('npm', ['run', 'build'], root);
const packed = await run('npm', ['pack', '--pack-destination', workDir, '--silent'], root);
const tarball = join(workDir, packed.trim().split('\n').at(-1) ?? '');
// Other tools may be regenerating assets in this working tree: refuse a
// tarball that misses whole folders instead of reporting confusing errors.
const listing = await run('tar', ['-tzf', tarball], workDir);
for (const required of ['package/dist/index.js', 'package/css/', 'package/svg/']) {
  if (!listing.split('\n').some((entry) => entry.startsWith(required))) {
    throw new Error(`${tarball} lacks ${required}; was the build still running?`);
  }
}
await writeFile(
  join(workDir, 'package.json'),
  JSON.stringify({
    private: true,
    type: 'module',
    dependencies: {
      pennants: `file:${tarball}`,
      react: '^19.3.0',
      'react-dom': '^19.3.0',
      vite: '^8.3.0',
    },
  }),
);
await run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], workDir);
const vite = JSON.parse(
  await readFile(join(workDir, 'node_modules', 'vite', 'package.json'), 'utf8'),
) as { version: string };

const results = new Map<string, Sizes | Error>();
await Promise.all(
  PROBES.map(async (probe) => {
    results.set(probe.name, await build(probe, workDir).catch((error: unknown) => error as Error));
  }),
);

const budgets = JSON.parse(await readFile(budgetPath, 'utf8').catch(() => '{}')) as Budgets;
const next: Budgets = {};
const failures: string[] = [];
const rows: string[] = [];
const records: Record<string, ProbeRecord> = {};
const triple = (sizes: Sizes, kind: 'js' | 'css'): Triple => ({
  min: sizes[`${kind}Min`] ?? 0,
  gzip: sizes[`${kind}Gzip`] ?? 0,
  brotli: sizes[`${kind}Brotli`] ?? 0,
});

for (const probe of PROBES) {
  const result = results.get(probe.name);
  const budget = budgets[probe.name];
  if (!(result instanceof Error) && result !== undefined) {
    const base = probe.baseline === undefined ? undefined : results.get(probe.baseline);
    if (base instanceof Error) throw base;
    const delta: Sizes = Object.fromEntries(
      METRICS.map((metric) => [
        metric,
        metric === 'lazyFiles'
          ? (result[metric] ?? 0)
          : (result[metric] ?? 0) - (base?.[metric] ?? 0),
      ]),
    );
    const signed = probe.baseline !== undefined;
    const cell = (kind: string): string =>
      [`${kind}Min`, `${kind}Gzip`, `${kind}Brotli`]
        .map((metric) => kB(delta[metric] ?? 0, signed))
        .join(' / ');
    const css = delta.cssMin ? cell('css') : '—';
    const js = cell('js');
    rows.push(`| ${probe.label} | ${js} | ${css} | ${delta.lazyFiles} |`);
    records[probe.name] = {
      label: probe.label,
      baseline: probe.baseline ?? null,
      entry: triple(delta, 'js'),
      css: delta.cssMin ? triple(delta, 'css') : null,
      lazyFiles: delta.lazyFiles ?? 0,
    };
    if (probe.baseline !== undefined) {
      next[probe.name] = Object.fromEntries(
        METRICS.filter((metric) => metric === 'lazyFiles' || (delta[metric] ?? 0) > 0).map(
          (metric) => [
            metric,
            metric === 'lazyFiles'
              ? (delta[metric] ?? 0)
              : Math.ceil(Math.max((delta[metric] ?? 0) * 1.05, (delta[metric] ?? 0) + 100) / 10) *
                10,
          ],
        ),
      );
      for (const [metric, limit] of Object.entries(budget ?? {})) {
        const value = delta[metric] ?? 0;
        if (limit !== undefined && value > limit) {
          failures.push(`${probe.name}: ${metric} ${value} > budget ${limit}`);
        }
      }
    }
  } else if (probe.optional && budget === undefined) {
    rows.push(`| ${probe.label} | n/a | n/a | n/a |`);
  } else {
    failures.push(`${probe.name}: build failed\n${String(result)}`);
    rows.push(`| ${probe.label} | build failed | | |`);
  }
}

console.info(
  `Vite ${vite.version} production build; up-front JS and CSS compared with an empty app ` +
    `(React rows: compared with an empty React app). Min / gzip / brotli.\n`,
);
console.info('| Probe | Entry JS | CSS | Lazy JS files |');
console.info('| ----- | -------- | --- | ------------- |');
for (const row of rows) console.info(row);

if (jsonPath !== undefined) {
  const snapshot = { vite: vite.version, generated: new Date().toISOString(), probes: records };
  await writeFile(resolve(jsonPath), `${JSON.stringify(snapshot, null, 2)}\n`);
  console.info(`\nMeasurements written to ${resolve(jsonPath)}`);
}

if (snapshotPath !== undefined) {
  const committed = JSON.parse(await readFile(resolve(snapshotPath), 'utf8')) as {
    probes: Record<string, ProbeRecord>;
  };
  const drift: string[] = [];
  const names = new Set([...Object.keys(committed.probes), ...Object.keys(records)]);
  for (const name of names) {
    const was = committed.probes[name];
    const now = records[name];
    if (was === undefined || now === undefined) {
      drift.push(
        `${name}: ${was === undefined ? 'missing from the snapshot' : 'no longer measured'}`,
      );
      continue;
    }
    if (was.lazyFiles !== now.lazyFiles) {
      drift.push(`${name}.lazyFiles: ${was.lazyFiles} -> ${now.lazyFiles}`);
    }
    for (const part of ['entry', 'css'] as const) {
      for (const metric of ['min', 'gzip', 'brotli'] as const) {
        const before = was[part]?.[metric] ?? 0;
        const after = now[part]?.[metric] ?? 0;
        if (Math.abs(after - before) > Math.max(50, before * 0.02)) {
          drift.push(`${name}.${part}.${metric}: ${before} -> ${after}`);
        }
      }
    }
  }
  if (drift.length > 0) {
    console.error(
      `\n${snapshotPath} is stale; regenerate it with\n` +
        `  node scripts/bundle-budget.ts --json ${snapshotPath}\n${drift.join('\n')}`,
    );
    process.exitCode = 1;
  } else {
    console.info(`\n${snapshotPath} matches this run.`);
  }
}

if (args.has('--update')) {
  await writeFile(budgetPath, `${JSON.stringify(next, null, 2)}\n`);
  console.info(`\nBudgets written to ${budgetPath}`);
} else if (failures.length > 0) {
  console.error(`\nOver budget:\n${failures.join('\n')}`);
  process.exitCode = 1;
}

if (args.has('--keep') || process.exitCode === 1) console.info(`\nWork dir: ${workDir}`);
else await rm(workDir, { recursive: true, force: true });
