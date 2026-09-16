import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5182',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  workers: 2,
  webServer: {
    command: 'npm run dev -- --port 5182 --strictPort',
    url: 'http://localhost:5182',
    reuseExistingServer: false,
  },
});
