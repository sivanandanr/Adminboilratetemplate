import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4200', browserName: 'chromium', channel: 'chrome', viewport: { width: 1672, height: 941 } },
  webServer: { command: 'npm.cmd start -- --host 127.0.0.1', url: 'http://127.0.0.1:4200', reuseExistingServer: !process.env['CI'], timeout: 120000 }
});
