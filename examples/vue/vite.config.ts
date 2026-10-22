import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        // Tell Vue that <pennant-flag> is a custom element, not a Vue component.
        compilerOptions: { isCustomElement: (tag) => tag === 'pennant-flag' },
      },
    }),
  ],
});
