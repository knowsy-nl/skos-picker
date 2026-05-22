import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    // .ts is type-checked by `tsc` (build:angular); ESLint here covers JS/JSX.
    ignores: ['dist/**', 'node_modules/**', '**/*.ts'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Test files use Vitest globals when enabled; keep them lenient.
    files: ['**/*.test.{js,jsx,ts}', '**/*.dom.test.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
