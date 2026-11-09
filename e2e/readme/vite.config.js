import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The README pins the CDN URL to the published version; use the installed one.
const { version } = JSON.parse(
  readFileSync(new URL(import.meta.resolve('pennants/package.json')), 'utf8'),
);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'pennants-version',
      transformIndexHtml: (html) => html.replaceAll('__PENNANTS_VERSION__', version),
    },
  ],
});
