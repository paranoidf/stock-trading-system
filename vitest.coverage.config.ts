import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    include: [
      'packages/**/tests/**/*.test.ts',
      'apps/server/tests/**/*.test.ts',
      'apps/web/src/**/*.test.ts'
    ],
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['apps/server/src/**/*.ts'],
      exclude: ['apps/server/src/server.ts', 'apps/server/src/index.ts'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 }
    }
  }
});
