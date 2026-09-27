import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/tests/**/*.test.ts', 'apps/**/tests/**/*.unit.test.ts', 'apps/web/src/**/*.test.ts'],
    exclude: ['**/*.integration.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['apps/server/src/**/*.ts'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 }
    }
  }
});
