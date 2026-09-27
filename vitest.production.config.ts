import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/server/tests/production.integration.test.ts'],
    testTimeout: 10_000,
    hookTimeout: 10_000
  }
});
