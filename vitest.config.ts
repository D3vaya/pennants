import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __PENNANTS_VERSION__: JSON.stringify('0.0.0-test') },
  test: {
    globalSetup: ['./test/global-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/lib/**/*.ts'],
      exclude: ['src/generated/**', '**/*.d.ts'],
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
});
