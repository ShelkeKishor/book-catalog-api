export default {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
