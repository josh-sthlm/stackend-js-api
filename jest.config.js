module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 15000,
  setupFiles: ['jest-localstorage-mock'],
  testRegex: '(/tests/.*\\.spec\\.[tj]s)$',
  coverageProvider: 'v8'
};
