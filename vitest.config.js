import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The React plugin transforms JSX in *.test.jsx. The Angular adapter test
  // imports a .ts file; esbuild strips its decorators (we test the class
  // behavior directly, so decorator metadata isn't needed).
  plugins: [react()],
  esbuild: {
    // Allow the @Directive/@HostListener decorators in the .ts source to be
    // parsed (then dropped) when the Angular test imports the directive.
    tsconfigRaw: {
      compilerOptions: { experimentalDecorators: true },
    },
  },
  test: {
    // happy-dom gives us customElements / HTMLElement / fetch / DOM for the
    // web-component and React tests.
    environment: 'happy-dom',
    include: ['src/**/*.{test,dom.test}.{js,jsx,ts}'],
    globals: false,
  },
});
