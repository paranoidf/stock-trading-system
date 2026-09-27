import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/server/tests/**/*.integration.test.ts'],
    passWithNoTests: true,
    testTimeout: 10_000,
    hookTimeout: 10_000
  }
});
