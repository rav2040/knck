module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  preset: 'ts-jest',
  setupFiles: ['dotenv/config'],
  clearMocks: true,
};
