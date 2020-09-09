module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/cypress/',
  ],
  preset: 'ts-jest',
  setupFiles: ['dotenv/config'],
  clearMocks: true,
};
