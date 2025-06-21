export default {
  testEnvironment: 'node',
  verbose: true,
  // detectOpenHandles: true, // This can cause issues with ESM
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['server.js'],
  testRegex: '(/__tests__/.*|(\\|/)(test|spec))\\.js$',
  clearMocks: true,
  transform: {},
};
