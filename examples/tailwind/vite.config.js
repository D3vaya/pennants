import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    // Keep the 271 flag SVGs referenced by pennants.css as separate files
    // instead of inlining them as data URIs into your CSS.
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
});
