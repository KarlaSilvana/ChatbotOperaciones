module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'app.js',
    '!src/**/*.test.js',
    '!node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  testTimeout: 10000
};
