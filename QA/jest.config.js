module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  setupFilesAfterEnv: ['./jest.setup.js'],
  globalSetup: './setup-global.js',
};
