require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.API_URL || 'http://localhost:5000',
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  },
  // Lance le serveur automatiquement si NODE_ENV !== 'ci'
  ...(process.env.NODE_ENV !== 'ci' && {
    webServer: {
      command: 'node src/index.js',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: true,
      timeout: 15000,
      env: { ...process.env },
    },
  }),
});
