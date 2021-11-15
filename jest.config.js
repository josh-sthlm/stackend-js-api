module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 10000,
  setupFiles: ['jest-localstorage-mock']
};
