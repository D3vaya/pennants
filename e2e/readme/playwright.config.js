import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.js',
  use: { baseURL: 'http://localhost:4317' },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4317',
    reuseExistingServer: false,
  },
});
