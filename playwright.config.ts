import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // CI runs Chromium only to keep the pipeline fast and dependency-light.
  // To run the full browser matrix locally (Firefox + WebKit/Safari):
  //   ALL_BROWSERS=true npm run test:e2e
  projects: process.env['ALL_BROWSERS']
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
      ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js',
    url: 'http://localhost:5173',
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
});
