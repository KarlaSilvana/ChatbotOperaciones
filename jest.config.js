module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'app.js',
    'server.js',
    '!src/**/*.test.js',
    '!node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  testTimeout: 10000
};
