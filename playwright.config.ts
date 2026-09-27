import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'output/playwright/test-results',
  reporter: [['list'], ['html', { outputFolder: 'output/playwright/report', open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://127.0.0.1:3200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://127.0.0.1:3200/api/health',
    timeout: 120_000,
    reuseExistingServer: false,
    env: { ...process.env, NODE_ENV: 'production', PORT: '3200' }
  }
});
