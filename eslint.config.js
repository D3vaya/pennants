import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'coverage/',
      'svg/',
      'png/',
      'css/',
      'sprite/',
      'src/generated/',
      'reference/',
      'examples/',
      'docs/.vitepress/cache/',
      'docs/.vitepress/dist/',
      'docs/public/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },
);
