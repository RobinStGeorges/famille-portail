import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Config dédiée aux tests (vite.config.ts, avec le plugin PWA, n'est pas utilisé ici).
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify('test') },
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
});
