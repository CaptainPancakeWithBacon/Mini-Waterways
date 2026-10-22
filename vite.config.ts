import { defineConfig } from 'vitest/config';

export default defineConfig({
  // relative base works on GitHub Pages under any repo name
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
});
