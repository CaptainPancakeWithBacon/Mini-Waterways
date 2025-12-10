import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Use '/' for Netlify, '/Mini-Waterways/' for GitHub Pages
  base: process.env.NETLIFY ? '/' : '/Mini-Waterways/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
