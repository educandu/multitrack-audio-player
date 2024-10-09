import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.js'],
    exclude: [],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**']
    }
  }
});
