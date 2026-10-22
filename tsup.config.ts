import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';
import pkg from './package.json' with { type: 'json' };

const flagEntries = Object.fromEntries(
  readdirSync('src/generated/flags')
    .filter((file) => file.endsWith('.ts'))
    .map((file) => [`flags/${file.slice(0, -3)}`, `src/generated/flags/${file}`]),
);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.tsx',
    'element/index': 'src/element/index.ts',
    'element/register': 'src/element/register.ts',
    ...flagEntries,
  },
  format: ['esm'],
  target: 'es2022',
  define: { __PENNANTS_VERSION__: JSON.stringify(pkg.version) },
  dts: true,
  splitting: true,
  treeshake: true,
  minify: true,
  sourcemap: false,
  clean: true,
  external: ['react', 'react/jsx-runtime'],
});
