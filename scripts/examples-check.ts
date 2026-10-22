/**
 * Builds the package, packs it and proves every example in `examples/` works
 * against the packed tarball: each example is copied to a temp dir, its
 * `pennants` dependency is pointed at the tarball, then it is installed,
 * built for production and its output is checked for expected markup.
 *
 *   node scripts/examples-check.ts              # all examples
 *   node scripts/examples-check.ts vite astro   # only these
 *   node scripts/examples-check.ts --no-build   # reuse the current build
 *   node scripts/examples-check.ts --keep       # keep the temp dir
 *
 * Env: EXAMPLES_CONCURRENCY (default 3).
 */
import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, relative, resolve } from 'node:path';

interface Expectation {
  /** Output directory, relative to the example. */
  dir: string;
  /** File extension to scan inside `dir` (recursively). */
  ext: string;
  /** Every string must appear in at least one scanned file. */
  includes: string[];
}

interface Example {
  name: string;
  expect: Expectation[];
}

const root = resolve(import.meta.dirname, '..');
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
  version: string;
};

const EXAMPLES: Example[] = [
  {
    name: 'html-cdn',
    expect: [
      {
        dir: 'dist',
        ext: '.html',
        includes: [`pennants@${version}/`, 'class="pn pn-ar"', '<pennant-flag'],
      },
      { dir: 'dist/pennants/css', ext: '.css', includes: ['.pn-ar{'] },
      { dir: 'dist/pennants/svg', ext: '.svg', includes: ['pn-ar-clip'] },
      { dir: 'dist/pennants/dist/element', ext: '.js', includes: ['definePennantElement'] },
    ],
  },
  {
    name: 'vite',
    expect: [
      { dir: 'dist/assets', ext: '.js', includes: ['pn-ar-clip', '#pn-mx'] },
      // Flags referenced by the CSS are emitted as files, not inlined.
      { dir: 'dist/assets', ext: '.css', includes: ['.pn-ar{background-image:url(/assets/ar-'] },
      { dir: 'dist/assets', ext: '.svg', includes: ['id="pn-mx"'] },
    ],
  },
  {
    name: 'nextjs',
    expect: [
      {
        dir: '.next/server/app',
        ext: '.html',
        includes: [
          'data-pennant="ar"',
          '-ar-clip',
          'data-pennant="br"',
          'class="pn pn-de',
          '/_next/static/media/jp.',
        ],
      },
    ],
  },
  {
    name: 'vue',
    expect: [{ dir: 'dist/assets', ext: '.js', includes: ['pennant-flag', 'pn-ar-clip'] }],
  },
  {
    name: 'svelte',
    expect: [
      {
        dir: 'build',
        ext: '.html',
        includes: ['pn-ar-clip', 'class="pn pn-de', '<pennant-flag code="br"'],
      },
    ],
  },
  {
    name: 'angular',
    expect: [
      { dir: 'dist/angular/browser', ext: '.js', includes: ['pennant-flag', 'pn-ar-clip'] },
      { dir: 'dist/angular/browser', ext: '.css', includes: ['.pn-de{'] },
    ],
  },
  {
    name: 'astro',
    expect: [
      {
        dir: 'dist',
        ext: '.html',
        includes: ['pn-ar-clip', 'class="pn pn-de', 'data-pennant="br"', '<astro-island'],
      },
    ],
  },
  {
    name: 'tailwind',
    expect: [
      {
        dir: 'dist/assets',
        ext: '.css',
        includes: ['@layer components{.pn{', '.pn-ar{background-image:url(/assets/ar-', '.h-12{'],
      },
      { dir: 'dist', ext: '.html', includes: ['pn pn-ar'] },
    ],
  },
];

/** Build output and dependency folders never copied into the temp dir. */
const SKIP = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  '.svelte-kit',
  '.astro',
  '.angular',
  'package-lock.json',
  'next-env.d.ts',
]);

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith('--')));
const only = args.filter((arg) => !arg.startsWith('--'));
const unknown = only.filter((name) => !EXAMPLES.some((example) => example.name === name));
if (unknown.length > 0) throw new Error(`Unknown example(s): ${unknown.join(', ')}`);
const selected = only.length > 0 ? EXAMPLES.filter((e) => only.includes(e.name)) : EXAMPLES;
const concurrency = Math.max(1, Number(process.env.EXAMPLES_CONCURRENCY ?? 3));

function run(command: string, commandArgs: string[], cwd: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      shell: process.platform === 'win32',
      env: { ...process.env, CI: 'true', NEXT_TELEMETRY_DISABLED: '1', NG_CLI_ANALYTICS: 'false' },
    });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise(output);
      else {
        const tail = output.trim().split('\n').slice(-40).join('\n');
        reject(new Error(`\`${command} ${commandArgs.join(' ')}\` exited with ${code}\n${tail}`));
      }
    });
  });
}

async function files(dir: string, ext: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true });
  return entries.filter((entry) => extname(entry) === ext).map((entry) => join(dir, entry));
}

async function check(example: Example, tarball: string, workDir: string): Promise<void> {
  const source = join(root, 'examples', example.name);
  const dir = join(workDir, example.name);
  await cp(source, dir, { recursive: true, filter: (path) => !SKIP.has(basename(path)) });

  const manifestPath = join(dir, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  if (manifest.dependencies?.pennants === undefined) {
    throw new Error(`${example.name}: package.json must depend on pennants`);
  }
  manifest.dependencies.pennants = `file:${tarball}`;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  await run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], dir);
  await run('npm', ['run', 'build'], dir);

  for (const { dir: outDir, ext, includes } of example.expect) {
    const target = join(dir, outDir);
    const contents = await Promise.all(
      (await files(target, ext)).map((file) => readFile(file, 'utf8')),
    );
    if (contents.length === 0) throw new Error(`${example.name}: no ${ext} files in ${outDir}`);
    const missing = includes.filter((needle) => !contents.some((text) => text.includes(needle)));
    if (missing.length > 0) {
      throw new Error(`${example.name}: ${outDir}/**/*${ext} lacks ${JSON.stringify(missing)}`);
    }
  }
}

const workDir = await mkdtemp(join(tmpdir(), 'pennants-examples-'));
if (!flags.has('--no-build')) await run('npm', ['run', 'build'], root);
const packed = await run('npm', ['pack', '--pack-destination', workDir, '--silent'], root);
const tarball = join(workDir, packed.trim().split('\n').at(-1) ?? '');
console.info(`Packed ${relative(workDir, tarball)} into ${workDir}`);

const failures: string[] = [];
const queue = [...selected];
await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    for (let example = queue.shift(); example; example = queue.shift()) {
      const started = Date.now();
      try {
        await check(example, tarball, workDir);
        console.info(`✔ ${example.name} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
      } catch (error) {
        failures.push(example.name);
        console.error(`✘ ${example.name}\n${error instanceof Error ? error.message : error}`);
      }
    }
  }),
);

if (failures.length > 0) {
  console.error(`\n${failures.length} example(s) failed: ${failures.join(', ')}`);
  console.error(`Work dir kept: ${workDir}`);
  process.exitCode = 1;
} else if (flags.has('--keep')) {
  console.info(`Work dir kept: ${workDir}`);
} else {
  await rm(workDir, { recursive: true, force: true });
}
