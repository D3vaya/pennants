import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  vite: {
    build: {
      // Keep the 271 flag SVGs referenced by pennants.css as separate files
      // instead of inlining them as data URIs into your CSS.
      assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
    },
  },
});
