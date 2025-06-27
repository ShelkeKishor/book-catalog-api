export default {
  testEnvironment: 'node',
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  testTimeout: 10000,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['server.js'],
  testRegex: '(/__tests__/.*|(\\|/)(test|spec))\\.js$',
  clearMocks: true,
  transform: {},
  setupFilesAfterEnv: ['./__tests__/setup.js']
};
