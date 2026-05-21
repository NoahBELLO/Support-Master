module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/db.js',
    '!src/**/*.repository.js',          // testés contre une vraie DB en E2E
    '!src/modules/categories/*.js',     // TODO: ajouter tests d'intégration
    '!src/modules/users/user.controller.js', // TODO: ajouter tests d'intégration
    '!src/config/metrics.js',           // infrastructure, pas de logique métier
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70, branches: 60 },
  },
};
