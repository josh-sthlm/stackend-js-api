module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    browsers: ['chrome', 'firefox', 'safari']
  },
  verbose: true,
  testTimeout: 15000,
  setupFiles: ['jest-localstorage-mock'],
  testRegex: '(/tests/.*\\.spec\\.[tj]s)$',
  coverageProvider: 'v8',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js)$': 'babel-jest'
  },
  transformIgnorePatterns: []
};
