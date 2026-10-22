/**
 * Builds the package with the real tsup config, then bundles consumer apps
 * with esbuild and rolldown (Vite 8's bundler) to prove tree-shaking: apps
 * that only use loader-free APIs must not get the per-flag loader map or any
 * of the 271 flag chunks.
 */
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build as esbuild } from 'esbuild';
import { build as rolldown } from 'rolldown';
import { build as tsup } from 'tsup';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '../tsup.config.ts';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  sideEffects: string[];
};

let root = '';
const dist = (file: string): string => join(root, 'node_modules/pennants/dist', file);

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'pennants-bundle-'));
  const pkgDir = join(root, 'node_modules/pennants');
  mkdirSync(pkgDir, { recursive: true });
  // The real sideEffects list: bundlers read it from the package's package.json.
  writeFileSync(
    join(pkgDir, 'package.json'),
    JSON.stringify({ name: 'pennants', type: 'module', sideEffects: pkg.sideEffects }),
  );
  await tsup({ ...config, outDir: join(pkgDir, 'dist'), dts: false, silent: true });
}, 120_000);

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

interface Bundle {
  files: number;
  code: string;
}

async function withEsbuild(source: string): Promise<Bundle> {
  const result = await esbuild({
    stdin: { contents: source, resolveDir: root, loader: 'js' },
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: join(root, 'out-esbuild'),
    write: false,
    external: ['react', 'react/jsx-runtime', 'react-dom'],
    logLevel: 'silent',
  });
  return {
    files: result.outputFiles.filter((file) => file.path.endsWith('.js')).length,
    code: result.outputFiles.map((file) => file.text).join('\n'),
  };
}

async function withRolldown(source: string): Promise<Bundle> {
  const entry = join(root, `entry-${Math.random().toString(36).slice(2)}.js`);
  writeFileSync(entry, source);
  const result = await rolldown({
    input: entry,
    cwd: root,
    external: ['react', 'react/jsx-runtime', 'react-dom'],
    logLevel: 'silent',
    write: false,
    output: { format: 'esm' },
  });
  const chunks = result.output.filter((item) => item.type === 'chunk');
  return { files: chunks.length, code: chunks.map((chunk) => chunk.code).join('\n') };
}

const use = (name: string, file: string): string =>
  `import { ${name} } from 'pennants/dist/${file}'; console.log(${name});`;

/** Import-free module graphs: no bundler may emit the loader map or flag chunks. */
const LOADER_FREE = {
  'PennantSvg from pennants/react/static': use('PennantSvg', 'react/static.js'),
  'fetchPennant from pennants/fetch': use('fetchPennant', 'fetch.js'),
};

/**
 * Barrels whose graph also contains the lazy loader: rolldown/Rollup (Vite)
 * drop unused code including its `import()`s; esbuild keeps emitting every
 * reachable `import()` chunk, hence the loader-free subpaths above.
 */
const BARRELS = {
  'PennantSvg from pennants/react': use('PennantSvg', 'react/index.js'),
  'fetchPennant from pennants': use('fetchPennant', 'index.js'),
  'pennantUrl from pennants': use('pennantUrl', 'index.js'),
};

const noLoader = async (bundle: (source: string) => Promise<Bundle>, source: string) => {
  const { files, code } = await bundle(source);
  expect(files).toBe(1);
  expect(code).not.toMatch(/import\(/);
  expect(code).not.toMatch(/flags\//); // loader-map entries look like import("./flags/ar.js")
};

describe('tree-shaking with rolldown (Vite 8)', () => {
  it.each(Object.entries({ ...LOADER_FREE, ...BARRELS }))(
    '%s: no loader map, no flag chunks',
    (_case, source) => noLoader(withRolldown, source),
  );

  it('the element keeps the loader map out of the entry chunk (loaded only in bundled mode)', async () => {
    const { files, code } = await withRolldown(use('definePennantElement', 'element/index.js'));
    expect(files).toBeGreaterThan(200);
    const entry = code.split('\n').filter((line) => line.includes('import("./flags/'));
    expect(entry).toEqual([]); // the map lives in its own lazily imported chunk
  });
});

describe.each([
  ['esbuild', withEsbuild],
  ['rolldown', withRolldown],
])('tree-shaking with %s', (_name, bundle) => {
  it.each(Object.entries(LOADER_FREE))(
    '%s bundles no loader map and no flag chunks',
    async (_case, source) => {
      const { files, code } = await bundle(source);
      expect(files).toBe(1);
      expect(code).not.toMatch(/import\(/);
      expect(code).not.toMatch(/flags\//); // loader-map entries look like import("./flags/ar.js")
    },
  );

  it('PennantSvg does not pull the client component', async () => {
    const { code } = await bundle(LOADER_FREE['PennantSvg from pennants/react/static']);
    expect(code).not.toContain('useSyncExternalStore');
    expect(code).toContain('forwardRef');
  });

  it('Pennant keeps flags lazy: the loader map is a separate on-demand chunk', async () => {
    const { files, code } = await bundle(
      `import { Pennant } from 'pennants/dist/react/index.js'; console.log(Pennant);`,
    );
    expect(files).toBeGreaterThan(200);
    expect(code).toContain('useSyncExternalStore');
  });
});

describe('dist layout', () => {
  it("keeps 'use client' on the Pennant module only", () => {
    const client = readFileSync(dist('react/client.js'), 'utf8');
    const index = readFileSync(dist('react/index.js'), 'utf8');
    expect(client.startsWith('"use client";')).toBe(true);
    expect(index).not.toContain('use client');
    expect(index).toMatch(/from\s*"\.\/client\.js"/);
  });

  const allCode = (): string =>
    readdirSync(dist(''))
      .filter((file) => file.endsWith('.js'))
      .map((file) => readFileSync(dist(file), 'utf8'))
      .concat(
        ['react/index.js', 'react/client.js', 'react/static.js'].map((f) =>
          readFileSync(dist(f), 'utf8'),
        ),
      )
      .join('\n');

  it('never bundles React', () => {
    const code = allCode();
    expect(code).toMatch(/from\s*"react"/);
    expect(code).not.toContain('__CLIENT_INTERNALS');
    expect(code).not.toContain('react.transitional.element');
  });

  it('keeps /* @__PURE__ */ annotations on top-level calls', () => {
    const code = allCode();
    // forwardRef(function PennantSvg…) and forwardRef(function Pennant…)
    expect(code.match(/\/\* @__PURE__ \*\/ \w+\(\s*function/g)).toHaveLength(2);
    expect(code).toMatch(/\/\* @__PURE__ \*\/ new Set\(/);
  });
});
