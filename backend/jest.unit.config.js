const base = require('./jest.config.js');

module.exports = {
  ...base,
  collectCoverageFrom: [
    'src/**/*.service.js',
  ],
};
