export default {
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFiles: ['<rootDir>/__tests__/setup.js']
};
