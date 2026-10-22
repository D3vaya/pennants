import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // pennants.css references all 271 flag SVGs. Vite inlines files under 4 KiB
    // as data URIs, which would put ~380 KiB of flags into your CSS. Emit them as
    // separate files instead: the browser then downloads only the flags it shows.
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
});
