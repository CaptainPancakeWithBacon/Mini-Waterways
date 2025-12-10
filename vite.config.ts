import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Mini-Waterways/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
