import { defineConfig, devices } from '@playwright/test';

// A dedicated port, so a test run can never land on some other local site.
const port = 4329;
const url = `http://localhost:${port}`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  use: { baseURL: url },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  // --ignore-lock: a preview already running in the background must not stop the test server from starting
  webServer: {
    command: `astro preview --port ${port} --ignore-lock`,
    url,
    reuseExistingServer: !process.env.CI,
  },
});
