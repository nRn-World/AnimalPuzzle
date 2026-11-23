import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {serviceWorkerPlugin} from './tools/serviceWorkerPlugin.ts';

// GitHub Pages serves this project from /AnimalPuzzle/. Keep the root base
// during local development, and use the repository path in Actions builds.
const base =
  process.env.VITE_BASE_PATH ??
  (process.env.GITHUB_ACTIONS === 'true' ? '/AnimalPuzzle/' : '/');

export default defineConfig(() => {
  return {
    base,
    plugins: [react(), tailwindcss(), serviceWorkerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // The sandbox preview proxies the dev server through a *.e2b.app
      // hostname; without this allowlist Vite's host check returns 403.
      allowedHosts: ['.e2b.app'],
      // Set DISABLE_HMR=true to turn off hot reload and file watching.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
