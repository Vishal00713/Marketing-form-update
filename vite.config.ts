import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  return {
    // Base path configuration:
    // In dev server ('serve'), use '/' so local preview works cleanly.
    // In production build:
    // 1. If VITE_BASE_PATH is provided, use it.
    // 2. If running inside GitHub Actions (GITHUB_REPOSITORY is set e.g. "owner/repo"), use '/<repo>/'.
    // 3. Fallback to '/Marketing-form-update/' for GitHub Pages (https://vishal00713.github.io/Marketing-form-update/).
    base:
      command === 'serve'
        ? '/'
        : process.env.VITE_BASE_PATH ||
          (process.env.GITHUB_REPOSITORY
            ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
            : '/Marketing-form-update/'),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
