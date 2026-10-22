import { readdirSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';
import pkg from './package.json' with { type: 'json' };

type Plugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * Keeps `Pennant` in its own `dist/react/client.js` entry so its `'use client'`
 * directive stays at the top of the module that defines it: other modules
 * import `./client.tsx` as the external `./client.js` instead of having the
 * code hoisted into a shared chunk (which would drop the directive).
 */
const reactClientBoundary: Plugin = {
  name: 'react-client-boundary',
  setup(build) {
    build.onResolve({ filter: /^\.\/client\.tsx$/ }, (args) =>
      /[\\/]src[\\/]react[\\/]/.test(args.importer)
        ? { path: './client.js', external: true }
        : undefined,
    );
  },
};

/** `pennants/art/<set>/<code>`: one artwork module per flag and set. */
const artEntries = Object.fromEntries(
  ['1x1', '4x3'].flatMap((set) =>
    readdirSync(`src/generated/art/${set}`)
      .filter((file) => file.endsWith('.ts'))
      .map((file) => [`art/${set}/${file.slice(0, -3)}`, `src/generated/art/${set}/${file}`]),
  ),
);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    fetch: 'src/fetch.ts',
    'react/index': 'src/react/index.ts',
    'react/client': 'src/react/client.tsx',
    'react/static': 'src/react/static.ts',
    'element/index': 'src/element/index.ts',
    'element/register': 'src/element/register.ts',
    ...artEntries,
  },
  format: ['esm'],
  target: 'es2022',
  define: { __PENNANTS_VERSION__: JSON.stringify(pkg.version) },
  dts: true,
  splitting: true,
  // esbuild's own tree shaking (always on when bundling). A Rollup treeshake
  // pass would strip the `'use client'` directive of dist/react/client.js.
  treeshake: false,
  // No whitespace minification: it drops `/* @__PURE__ */` annotations, which
  // consumers' bundlers need to drop unused top-level calls (forwardRef, new Set).
  minifySyntax: true,
  minifyIdentifiers: true,
  sourcemap: false,
  clean: true,
  external: ['react', 'react/jsx-runtime'],
  esbuildPlugins: [reactClientBoundary],
});
