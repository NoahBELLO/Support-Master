module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/db.js',
    '!src/**/*.repository.js', // testés contre une vraie DB en E2E
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70, branches: 60 },
  },
};
