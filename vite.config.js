import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Dev server / demo build only. This config exists so the demos in /demo
// run standalone (`npm run dev`). The component sources in /src ship as-is
// and have no build step of their own.
export default defineConfig({
  root: '.',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        webComponent: resolve(__dirname, 'demo/web-component-demo.html'),
        react: resolve(__dirname, 'demo/react-demo.html'),
      },
    },
  },
});
