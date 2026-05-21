const base = require('./jest.config.js');

module.exports = {
  ...base,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/db.js',
    '!src/config/swagger.js',
    '!src/config/metrics.js',
    '!src/**/*.repository.js',
    '!src/modules/categories/*.js',
    '!src/modules/users/user.controller.js',
  ],
};
