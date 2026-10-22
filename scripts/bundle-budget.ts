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

const PROBES: Probe[] = [
  { name: 'empty', label: 'Empty app (baseline)', main: `document.body.append('ready');` },
  {
    name: 'react',
    label: 'Empty React app (baseline)',
    main: react(`jsx('b', {})`, ''),
  },
  {
    name: 'flag',
    label: '`pennants/flags/ar`',
    baseline: 'empty',
    main: `import ar from 'pennants/flags/ar';\ndocument.body.innerHTML = ar;`,
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
    main: `import { pennantUrl } from 'pennants';\ndocument.body.append(pennantUrl('ar'));`,
  },
  {
    name: 'load',
    label: '`loadPennant`',
    baseline: 'empty',
    main: `import { loadPennant } from 'pennants';\nloadPennant('ar').then((svg) => (document.body.innerHTML = svg));`,
  },
  {
    name: 'fetch',
    label: '`fetchPennant`',
    baseline: 'empty',
    optional: true,
    main: `import { fetchPennant } from 'pennants';\nfetchPennant('ar').then((svg) => (document.body.innerHTML = svg));`,
  },
  {
    name: 'element',
    label: '`pennants/element/register`',
    baseline: 'empty',
    main: `import 'pennants/element/register';\ndocument.body.innerHTML = '<pennant-flag code="ar"></pennant-flag>';`,
  },
  {
    name: 'react-pennant',
    label: 'React `<Pennant>`',
    baseline: 'react',
    main: react(`jsx(Pennant, { code: 'ar' })`, `import { Pennant } from 'pennants/react';`),
  },
  {
    name: 'react-svg',
    label: 'React `<PennantSvg>` + one flag',
    baseline: 'react',
    main: react(
      `jsx(PennantSvg, { svg: ar })`,
      `import { PennantSvg } from 'pennants/react';\nimport ar from 'pennants/flags/ar';`,
    ),
  },
  {
    name: 'css',
    label: 'CSS, `assetsInlineLimit` set',
    baseline: 'empty',
    config: NO_INLINE,
    main: `import 'pennants/css/pennants.min.css';\ndocument.body.innerHTML = '<span class="pn pn-ar"></span>';`,
  },
  {
    name: 'css-cdn',
    label: 'CSS, `pennants/css/cdn`',
    baseline: 'empty',
    optional: true,
    main: `import 'pennants/css/cdn';\ndocument.body.innerHTML = '<span class="pn pn-ar"></span>';`,
  },
  {
    name: 'css-default',
    label: 'CSS, Vite defaults (inlined flags)',
    baseline: 'empty',
    main: `import 'pennants/css/pennants.min.css';\ndocument.body.innerHTML = '<span class="pn pn-ar"></span>';`,
  },
];

const argv = process.argv.slice(2);
const args = new Set(argv);
const jsonIndex = argv.indexOf('--json');
const jsonPath = jsonIndex === -1 ? undefined : argv[jsonIndex + 1];
if (jsonIndex !== -1 && (jsonPath === undefined || jsonPath.startsWith('--'))) {
  throw new Error('--json needs a file path');
}

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

if (args.has('--update')) {
  await writeFile(budgetPath, `${JSON.stringify(next, null, 2)}\n`);
  console.info(`\nBudgets written to ${budgetPath}`);
} else if (failures.length > 0) {
  console.error(`\nOver budget:\n${failures.join('\n')}`);
  process.exitCode = 1;
}

if (args.has('--keep') || process.exitCode === 1) console.info(`\nWork dir: ${workDir}`);
else await rm(workDir, { recursive: true, force: true });
